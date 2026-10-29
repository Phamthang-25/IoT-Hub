require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const mqtt = require('mqtt');
const EventEmitter = require('events');

const app = express();
app.use(cors());
app.use(express.json());

// Event emitter để đồng bộ phản hồi từ phần cứng ESP32 theo thời gian thực
const deviceEvents = new EventEmitter();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Verify DB connection
pool.connect((err, client, release) => {
  if (err) return console.error('Error acquiring client', err.stack);
  console.log('Connected to PostgreSQL Database (Normalized Schema)');
  release();
});

// MQTT Connection & Realtime State Tracking
const mqttBroker = process.env.MQTT_BROKER || '127.0.0.1';
const mqttPort = process.env.MQTT_PORT || 8883;

let isMqttBrokerConnected = false;

const client = mqtt.connect(`mqtt://${mqttBroker}:${mqttPort}`, {
    username: process.env.MQTT_USERNAME || 'admin',
    password: process.env.MQTT_PASSWORD || '123456',
    clientId: 'nodejs_backend_' + Math.random().toString(16).substring(2, 8),
    reconnectPeriod: 2000 // Tự động thử kết nối lại mỗi 2 giây
});

client.on('connect', () => {
  isMqttBrokerConnected = true;
  console.log('Connected to MQTT broker at mqtt://' + mqttBroker + ':' + mqttPort);
  client.subscribe('data_sensor');
  client.subscribe('device_status');
});

client.on('reconnect', () => {
  isMqttBrokerConnected = false;
});

client.on('close', () => {
  isMqttBrokerConnected = false;
});

client.on('offline', () => {
  isMqttBrokerConnected = false;
});

client.on('end', () => {
  isMqttBrokerConnected = false;
});

client.on('error', (err) => {
  isMqttBrokerConnected = false;
  console.error('MQTT Connection Error:', err.message);
});

client.on('message', async (topic, message) => {
  const msgStr = message.toString();

  if (topic === 'data_sensor') {
    // Format từ ESP32: temperature=29.4,humidity=65.2,light=1820 hoặc temp=...,hum=...
    const parts = msgStr.split(',');
    let temp = null, hum = null, light = null;
    parts.forEach(part => {
      const [key, value] = part.split('=');
      const cleanKey = key ? key.trim().toLowerCase() : '';
      if (cleanKey === 'temperature' || cleanKey === 'temp') temp = parseFloat(value);
      if (cleanKey === 'humidity' || cleanKey === 'hum') hum = parseFloat(value);
      if (cleanKey === 'light') light = parseFloat(value);
    });

    if (temp !== null && hum !== null && light !== null) {
      try {
        // Lấy thời gian chung cho cả 3 sensor
        const now = new Date();
        
        // Insert từng loại cảm biến vào bảng data_sensor
        // TER01 = Nhiệt độ, MOIS01 = Độ ẩm, LIGHT01 = Ánh sáng
        await pool.query(
          `INSERT INTO data_sensor (sensor_id, value, recorded_at) 
           VALUES 
           ((SELECT id FROM sensors WHERE sensor_code = 'TER01'), $1, $4),
           ((SELECT id FROM sensors WHERE sensor_code = 'MOIS01'), $2, $4),
           ((SELECT id FROM sensors WHERE sensor_code = 'LIGHT01'), $3, $4)`,
          [temp, hum, light, now]
        );
      } catch (err) {
        console.error('Error inserting sensor data:', err);
      }
    }
  } else if (topic === 'device_status') {
    // Expected Format từ ESP32: LED1=ON hoặc LED2=OFF
    const parts = msgStr.trim().split('=');
    if (parts.length >= 2) {
      const deviceCode = parts[0].trim().toUpperCase();
      const status = parts[1].trim().toUpperCase();

      try {
        // 1. Cập nhật current_status trong bảng devices
        await pool.query(
            "UPDATE devices SET current_status = $1, updated_at = NOW() WHERE UPPER(device_code) = $2",
            [status, deviceCode]
        );

        // 2. Cập nhật status trong action_history nếu có bản ghi 'LOADING' đang chờ
        const result = await pool.query(
            `SELECT id FROM action_history 
             WHERE device_id = (SELECT id FROM devices WHERE UPPER(device_code) = $1) 
             AND status = 'LOADING' 
             ORDER BY id DESC LIMIT 1`,
            [deviceCode]
        );
        
        if (result.rows.length > 0) {
            await pool.query(
                "UPDATE action_history SET status = $1, response_time = NOW() WHERE id = $2",
                [status, result.rows[0].id]
            );
        } else {
            // Nếu không có record 'LOADING' (ví dụ nút bấm vật lý trên mạch), tạo log sự kiện
            await pool.query(
                `INSERT INTO action_history (device_id, action, status, action_time, response_time) 
                 VALUES ((SELECT id FROM devices WHERE UPPER(device_code) = $1), $2, $3, NOW(), NOW())`,
                [deviceCode, status, status]
            );
        }

        // 3. Kích hoạt event thông báo phần cứng đã phản hồi thành công
        deviceEvents.emit(`status_${deviceCode}`, { success: true, status });
      } catch (err) {
        console.error('Error handling device status:', err);
      }
    }
  }
});

// ======================= AUTHENTICATION MIDDLEWARE =======================
const API_TOKEN = process.env.API_TOKEN || 'iot_esp32_token_ptit_2026';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    // Hỗ trợ cả chuẩn "Bearer <token>" lẫn gửi token trực tiếp
    const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7).trim() 
        : authHeader;

    if (!token) {
        return res.status(401).json({ 
            success: false,
            error: 'Unauthorized: Yêu cầu Token xác thực (Thiếu Header Authorization: Bearer <TOKEN>)' 
        });
    }

    if (token !== API_TOKEN) {
        return res.status(403).json({ 
            success: false,
            error: 'Forbidden: Token xác thực không chính xác hoặc không có quyền truy cập' 
        });
    }

    next();
};

// Áp dụng xác thực Token bắt buộc cho toàn bộ các endpoints /api/*
app.use('/api', authenticateToken);

// ======================= REST APIs =======================

// Lấy thông số môi trường mới nhất
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.sensor_type, ds.value, ds.recorded_at
            FROM data_sensor ds
            JOIN sensors s ON ds.sensor_id = s.id
            WHERE (ds.sensor_id, ds.recorded_at) IN (
                SELECT sensor_id, MAX(recorded_at) 
                FROM data_sensor 
                GROUP BY sensor_id
            )
        `);
        
        const stats = { temperature: 0, humidity: 0, light: 0 };
        result.rows.forEach(row => {
            if (row.sensor_type === 'TEMPERATURE') stats.temperature = row.value;
            if (row.sensor_type === 'HUMIDITY') stats.humidity = row.value;
            if (row.sensor_type === 'LIGHT') stats.light = row.value;
        });
        // Trạng thái kết nối thời gian thực của MQTT Broker
        stats.mqtt_connected = Boolean(isMqttBrokerConnected && client && client.connected);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lấy biểu đồ lịch sử 20 điểm gần nhất
app.get('/api/dashboard/chart', async (req, res) => {
    try {
        // Group các loại data_sensor cùng 1 thời điểm (recorded_at) lại thành các điểm biểu đồ
        const result = await pool.query(`
            SELECT 
                ds.recorded_at as created_at,
                MAX(CASE WHEN s.sensor_type = 'TEMPERATURE' THEN ds.value END) as temperature,
                MAX(CASE WHEN s.sensor_type = 'HUMIDITY' THEN ds.value END) as humidity,
                MAX(CASE WHEN s.sensor_type = 'LIGHT' THEN ds.value END) as light
            FROM data_sensor ds
            JOIN sensors s ON ds.sensor_id = s.id
            GROUP BY ds.recorded_at
            ORDER BY ds.recorded_at DESC
            LIMIT 20
        `);
        // Phải đảo ngược để thời gian tăng dần trên biểu đồ
        res.json(result.rows.reverse());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API cho trang Cảm biến dữ liệu (Data Grid)
app.get('/api/sensors', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ds.id, s.sensor_code, s.sensor_name, ds.value, s.sensor_type, ds.recorded_at as created_at
            FROM data_sensor ds
            JOIN sensors s ON ds.sensor_id = s.id
            ORDER BY ds.recorded_at DESC
            LIMIT 50
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API cho trang Lịch sử hành động (Hỗ trợ phân trang: ?page=1&limit=10 & lọc tùy chọn)
app.get('/api/history', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Xử lý các bộ lọc tùy chọn nếu có
        const { device, action, status } = req.query;
        let whereClauses = [];
        let params = [];

        if (device && device !== 'ALL') {
            params.push(device.toUpperCase());
            whereClauses.push(`UPPER(d.device_code) = $${params.length}`);
        }
        if (action && action !== 'ALL') {
            params.push(action.toUpperCase());
            whereClauses.push(`UPPER(ah.action) = $${params.length}`);
        }
        if (status && status !== 'ALL') {
            params.push(status.toUpperCase());
            whereClauses.push(`UPPER(ah.status) = $${params.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. Đếm tổng số bản ghi thỏa điều kiện
        const countQuery = `
            SELECT COUNT(*) 
            FROM action_history ah 
            JOIN devices d ON ah.device_id = d.id 
            ${whereSql}
        `;
        const countRes = await pool.query(countQuery, params);
        const total = parseInt(countRes.rows[0].count, 10);
        const totalPages = Math.ceil(total / limit) || 1;

        // 2. Truy vấn dữ liệu phân trang theo LIMIT và OFFSET
        const dataParams = [...params, limit, offset];
        const dataQuery = `
            SELECT ah.id, d.device_code as device_id, d.device_name, ah.action, ah.status, ah.action_time as sent_at, ah.response_time as replied_at
            FROM action_history ah
            JOIN devices d ON ah.device_id = d.id
            ${whereSql}
            ORDER BY ah.action_time DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        const dataRes = await pool.query(dataQuery, dataParams);

        res.json({
            success: true,
            data: dataRes.rows,
            pagination: {
                total,
                page,
                limit,
                totalPages
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API lấy trạng thái thiết bị hiện hành
app.get('/api/devices/status', async (req, res) => {
    try {
        const result = await pool.query("SELECT device_code, current_status FROM devices");
        const statusMap = {};
        result.rows.forEach(r => {
            statusMap[r.device_code] = r.current_status;
        });
        res.json(statusMap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API gửi lệnh điều khiển (Chờ phản hồi thực tế từ phần cứng ESP32 qua MQTT)
app.post('/api/devices/control', async (req, res) => {
    const { deviceId, action } = req.body;
    if (!deviceId || !action) return res.status(400).json({ error: 'Missing deviceId or action' });

    const normalizedDeviceId = deviceId.trim().toUpperCase();
    const normalizedAction = action.trim().toUpperCase();

    // Kiểm tra kết nối MQTT Broker
    if (!client || !client.connected) {
        return res.status(503).json({ error: 'Hệ thống chưa kết nối tới MQTT Broker' });
    }

    let historyId = null;
    try {
        // 1. Ghi lại vào action_history với trạng thái 'LOADING'
        const historyRes = await pool.query(
            `INSERT INTO action_history (device_id, user_id, action, status, action_time) 
             VALUES ((SELECT id FROM devices WHERE UPPER(device_code) = $1), 1, $2, 'LOADING', NOW())
             RETURNING id`,
            [normalizedDeviceId, normalizedAction]
        );
        if (historyRes.rows.length > 0) {
            historyId = historyRes.rows[0].id;
        }

        // 2. Gửi lệnh MQTT tới ESP32 (Topic device_control, format: "LED1 ON" hoặc "LED1 OFF")
        const payload = `${normalizedDeviceId} ${normalizedAction}`;
        client.publish('device_control', payload, (err) => {
            if (err) console.error('MQTT publish error:', err.message);
        });

        // 3. Đợi phản hồi thực tế từ phần cứng ESP32 thông qua topic device_status
        // Timeout 8 giây đề phòng ESP32 mất nguồn hoặc mất mạng WiFi
        const waitHardwareResponse = new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                deviceEvents.removeListener(`status_${normalizedDeviceId}`, onStatus);
                reject(new Error('TIMEOUT'));
            }, 8000);

            const onStatus = (data) => {
                clearTimeout(timer);
                resolve(data);
            };

            deviceEvents.once(`status_${normalizedDeviceId}`, onStatus);
        });

        const hwResponse = await waitHardwareResponse;

        // Trả kết quả thành công ngay khi ESP32 phản hồi thực tế
        res.json({
            success: true,
            deviceId: normalizedDeviceId,
            status: hwResponse.status,
            message: `Thiết bị ${normalizedDeviceId} đã phản hồi trạng thái: ${hwResponse.status}`
        });
    } catch (err) {
        console.error('Error controlling device:', err.message);
        if (err.message === 'TIMEOUT') {
            if (historyId) {
                await pool.query(
                    "UPDATE action_history SET status = 'TIMEOUT', response_time = NOW() WHERE id = $1",
                    [historyId]
                ).catch(() => {});
            }
            return res.status(504).json({
                success: false,
                error: `Phần cứng ESP32 không phản hồi lệnh trong thời gian cho phép (8s). Vui lòng kiểm tra thiết bị.`
            });
        }
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
