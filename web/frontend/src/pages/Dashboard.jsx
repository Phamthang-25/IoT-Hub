import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, Sun, Lightbulb, Cpu, Server, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ temperature: 0, humidity: 0, light: 0 });
  const [chartData, setChartData] = useState([]);
  const [devices, setDevices] = useState({ LED1: 'OFF', LED2: 'OFF' });
  const [loadingDevices, setLoadingDevices] = useState({ LED1: false, LED2: false });
  const loadingDevicesRef = useRef({ LED1: false, LED2: false });
  loadingDevicesRef.current = loadingDevices;

  const fetchData = async () => {
    try {
      const [statsRes, chartRes, devicesRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`),
        axios.get(`${API_BASE}/dashboard/chart`),
        axios.get(`${API_BASE}/devices/status`)
      ]);
      setStats(statsRes.data);
      
      // format chart data timestamp to include seconds
      const formattedChart = chartRes.data.map(d => ({
        ...d,
        time: new Date(d.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', second: '2-digit'})
      }));
      setChartData(formattedChart);
      
      // Cập nhật trạng thái thiết bị (bảo lưu trạng thái nếu thiết bị đó đang trong 2s loading)
      setDevices(prev => {
        const next = { ...devicesRes.data };
        if (loadingDevicesRef.current.LED1) next.LED1 = prev.LED1;
        if (loadingDevicesRef.current.LED2) next.LED2 = prev.LED2;
        return next;
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleDevice = async (deviceId) => {
    // Nếu thiết bị đang trong quá trình chờ phần cứng phản hồi thì bỏ qua click tiếp theo
    if (loadingDevices[deviceId]) return;

    const currentStatus = devices[deviceId] || 'OFF';
    const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
    
    // Bật trạng thái loading hiển thị trên UI ngay lập tức
    setLoadingDevices(prev => ({ ...prev, [deviceId]: true }));
    
    try {
      // Gửi lệnh điều khiển tới máy chủ (sẽ đợi phản hồi ACK thật từ ESP32 qua MQTT)
      const res = await axios.post(`${API_BASE}/devices/control`, {
        deviceId,
        action: newStatus
      });

      if (res.data && res.data.success) {
        // Cập nhật trạng thái mới theo đúng phản hồi từ phần cứng ESP32
        setDevices(prev => ({ ...prev, [deviceId]: res.data.status }));
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      const errMsg = error.response?.data?.error || 'Lỗi: Không thể gửi lệnh hoặc phần cứng ESP32 không phản hồi.';
      alert(errMsg);
    } finally {
      // Tắt trạng thái loading sau khi nhận được phản hồi thật (hoặc sau khi timeout)
      setLoadingDevices(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Nhiệt độ */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider">NHIỆT ĐỘ</span>
              <div className="p-2 bg-red-50 text-red-500 rounded-xl"><Thermometer size={20} /></div>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-bold text-gray-800">{stats.temperature}</span>
              <span className="text-sm font-semibold text-gray-400">°C</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Định mức</span>
              <span className="font-semibold text-red-500">{Math.round(Math.min(100, (stats.temperature / 50) * 100))}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-400 to-red-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, (stats.temperature / 50) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Độ ẩm */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider">ĐỘ ẨM</span>
              <div className="p-2 bg-blue-50 text-blue-500 rounded-xl"><Droplets size={20} /></div>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-bold text-gray-800">{stats.humidity}</span>
              <span className="text-sm font-semibold text-gray-400">%</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Định mức</span>
              <span className="font-semibold text-blue-500">{Math.round(Math.min(100, stats.humidity))}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, stats.humidity))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Ánh sáng */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 tracking-wider">ÁNH SÁNG</span>
              <div className="p-2 bg-yellow-50 text-yellow-500 rounded-xl"><Sun size={20} /></div>
            </div>
            <div className="mt-2 flex items-baseline space-x-1.5">
              <span className="text-3xl font-bold text-gray-800">{stats.light}</span>
              <span className="text-sm font-semibold text-gray-400">%</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>Định mức</span>
              <span className="font-semibold text-yellow-600">{Math.round(Math.min(100, stats.light))}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-amber-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, stats.light))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <h3 className="font-bold text-base text-gray-800">Các thay đổi trong môi trường</h3>
          <div className="flex items-center space-x-4 text-xs font-medium text-gray-500">
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span>Nhiệt độ (°C)</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span>Độ ẩm (%)</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5"></span>Ánh sáng (%)</span>
          </div>
        </div>
        <div className="h-[310px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" minTickGap={30} tick={{fontSize: 12, fill: '#6b7280'}} tickMargin={8} />
              <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#6b7280'}} />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#ef4444" name="Nhiệt độ (°C)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="humidity" stroke="#3b82f6" name="Độ ẩm (%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="light" stroke="#eab308" name="Ánh sáng (%)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: 50 - 50 cân xứng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* System Status (50%) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-gray-800">Trạng thái hệ thống</h3>
            <span className="text-xs text-gray-400">Kết nối mạng</span>
          </div>

          <div className="space-y-3">
            {/* ESP32 Status */}
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50/80 border border-gray-100/80">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 shadow-sm">
                  <Cpu size={20} />
                </div>
                <div>
                  <span className="text-gray-800 font-semibold text-sm block">Thiết bị ESP32</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${chartData.length > 0 && (new Date() - new Date(chartData[chartData.length - 1].created_at)) < 15000 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}></div>
                <span className={`font-semibold px-3 py-0.5 rounded-full text-xs ${chartData.length > 0 && (new Date() - new Date(chartData[chartData.length - 1].created_at)) < 15000 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {chartData.length > 0 && (new Date() - new Date(chartData[chartData.length - 1].created_at)) < 15000 ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* MQTT Broker Status */}
            <div className="flex justify-between items-center p-3.5 rounded-xl bg-gray-50/80 border border-gray-100/80">
              <div className="flex items-center space-x-3.5">
                <div className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-600 shadow-sm">
                  <Server size={20} />
                </div>
                <div>
                  <span className="text-gray-800 font-semibold text-sm block">MQTT Broker</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                <span className="font-semibold text-green-600 bg-green-50 px-3 py-0.5 rounded-full text-xs">ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Controls (50%) - 2 Mini-Cards phong cách Apple Home */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-base text-gray-800">Điều khiển thiết bị</h3>
            <span className="text-xs text-gray-400">Smart Control</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Mini Card Đèn LED 1 */}
            <div 
              onClick={() => toggleDevice('LED1')}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                loadingDevices.LED1
                  ? 'bg-gradient-to-br from-purple-500/10 via-purple-50/70 to-indigo-500/5 border-purple-300 shadow-[0_4px_16px_rgba(168,85,247,0.2)] cursor-wait'
                  : devices.LED1 === 'ON'
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/5 border-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.2)] cursor-pointer'
                    : 'bg-gray-50/80 border-gray-200/80 hover:bg-gray-100/60 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  loadingDevices.LED1
                    ? 'bg-purple-100 text-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : devices.LED1 === 'ON' 
                      ? 'bg-amber-100 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.45)]' 
                      : 'bg-white text-gray-400 border border-gray-200/60 shadow-sm'
                }`}>
                  {loadingDevices.LED1 ? (
                    <Loader2 size={22} className="animate-spin text-purple-600" />
                  ) : (
                    <Lightbulb size={22} className={`transition-all duration-300 ${devices.LED1 === 'ON' ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]' : ''}`} />
                  )}
                </div>
                {/* Switch indicator */}
                <div className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                  loadingDevices.LED1
                    ? 'bg-purple-300'
                    : devices.LED1 === 'ON' ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                    loadingDevices.LED1
                      ? 'translate-x-2.5 opacity-90'
                      : devices.LED1 === 'ON' ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    {loadingDevices.LED1 && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-gray-900 font-bold text-sm block">Đèn LED 1</span>
                <span className={`text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  loadingDevices.LED1
                    ? 'text-purple-600 animate-pulse'
                    : devices.LED1 === 'ON' ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {loadingDevices.LED1 ? (
                    <span>Đang xử lý...</span>
                  ) : devices.LED1 === 'ON' ? (
                    <span>Đang bật</span>
                  ) : (
                    <span>Đang tắt</span>
                  )}
                </span>
              </div>
            </div>

            {/* Mini Card Đèn LED 2 */}
            <div 
              onClick={() => toggleDevice('LED2')}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${
                loadingDevices.LED2
                  ? 'bg-gradient-to-br from-purple-500/10 via-purple-50/70 to-indigo-500/5 border-purple-300 shadow-[0_4px_16px_rgba(168,85,247,0.2)] cursor-wait'
                  : devices.LED2 === 'ON'
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/5 border-amber-300 shadow-[0_4px_16px_rgba(245,158,11,0.2)] cursor-pointer'
                    : 'bg-gray-50/80 border-gray-200/80 hover:bg-gray-100/60 cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  loadingDevices.LED2
                    ? 'bg-purple-100 text-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : devices.LED2 === 'ON' 
                      ? 'bg-amber-100 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.45)]' 
                      : 'bg-white text-gray-400 border border-gray-200/60 shadow-sm'
                }`}>
                  {loadingDevices.LED2 ? (
                    <Loader2 size={22} className="animate-spin text-purple-600" />
                  ) : (
                    <Lightbulb size={22} className={`transition-all duration-300 ${devices.LED2 === 'ON' ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.9)]' : ''}`} />
                  )}
                </div>
                {/* Switch indicator */}
                <div className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                  loadingDevices.LED2
                    ? 'bg-purple-300'
                    : devices.LED2 === 'ON' ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 flex items-center justify-center ${
                    loadingDevices.LED2
                      ? 'translate-x-2.5 opacity-90'
                      : devices.LED2 === 'ON' ? 'translate-x-5' : 'translate-x-0'
                  }`}>
                    {loadingDevices.LED2 && (
                      <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping"></span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-gray-900 font-bold text-sm block">Đèn LED 2</span>
                <span className={`text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  loadingDevices.LED2
                    ? 'text-purple-600 animate-pulse'
                    : devices.LED2 === 'ON' ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {loadingDevices.LED2 ? (
                    <span>Đang xử lý...</span>
                  ) : devices.LED2 === 'ON' ? (
                    <span>Đang bật</span>
                  ) : (
                    <span>Đang tắt</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
