-- Drop if exists (cho việc chạy lại dễ dàng)
DROP TABLE IF EXISTS data_sensor CASCADE;
DROP TABLE IF EXISTS sensors CASCADE;
DROP TABLE IF EXISTS action_history CASCADE;
DROP TABLE IF EXISTS devices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS device_status_enum;
DROP TYPE IF EXISTS action_enum;

-- Khởi tạo Enums
CREATE TYPE device_status_enum AS ENUM ('ON', 'OFF', 'LOADING', 'ERROR');
CREATE TYPE action_enum AS ENUM ('ON', 'OFF');

-- 1. Bảng Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100)
);

-- 2. Bảng Devices
CREATE TABLE devices (
    id SERIAL PRIMARY KEY,
    device_code VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    current_status device_status_enum DEFAULT 'OFF',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng Action History
CREATE TABLE action_history (
    id BIGSERIAL PRIMARY KEY,
    device_id INT REFERENCES devices(id),
    user_id INT REFERENCES users(id),
    action action_enum NOT NULL,
    status device_status_enum DEFAULT 'LOADING',
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_time TIMESTAMP
);

-- 4. Bảng Sensors
CREATE TABLE sensors (
    id SERIAL PRIMARY KEY,
    sensor_code VARCHAR(50) UNIQUE NOT NULL,
    sensor_name VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    unit VARCHAR(10)
);

-- 5. Bảng Data Sensor
CREATE TABLE data_sensor (
    id BIGSERIAL PRIMARY KEY,
    sensor_id INT REFERENCES sensors(id),
    value FLOAT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu mẫu ban đầu
INSERT INTO users (username, password_hash, full_name) VALUES 
('admin', '123456', 'Phạm Bá Thắng');

INSERT INTO devices (device_code, device_name, current_status) VALUES 
('LED1', 'Quạt điện', 'OFF'), 
('LED2', 'Bóng đèn', 'OFF');

INSERT INTO sensors (sensor_code, sensor_name, sensor_type, unit) VALUES 
('TER01', 'CB Nhiệt độ', 'TEMPERATURE', '°C'), 
('MOIS01', 'CB Độ ẩm', 'HUMIDITY', '%'), 
('LIGHT01', 'CB Ánh sáng', 'LIGHT', 'LUX');
