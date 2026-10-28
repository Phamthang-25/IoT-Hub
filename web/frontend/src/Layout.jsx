import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Activity, User, Clock } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const formatDateTime = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Bảng điều khiển';
      case '/sensors': return 'Dữ liệu cảm biến';
      case '/history': return 'Lịch sử hành động';
      case '/profile': return 'Hồ sơ cá nhân';
      default: return 'Trang hiện tại';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-[#110C24] text-white flex flex-col">
        <div className="p-4 flex items-center space-x-3 text-xl font-bold border-b border-gray-800">
          <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white text-sm">IoT</span>
          </div>
          <span>IoT Hub</span>
        </div>
        
        <nav className="flex-1 px-2 py-6 space-y-2">
          <NavLink 
            to="/" 
            className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
            end
          >
            <LayoutDashboard size={20} />
            <span>Bảng điều khiển</span>
          </NavLink>
          
          <NavLink 
            to="/sensors" 
            className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Database size={20} />
            <span>Dữ liệu cảm biến</span>
          </NavLink>
          
          <NavLink 
            to="/history" 
            className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Activity size={20} />
            <span>Lịch sử hành động</span>
          </NavLink>
          
          <NavLink 
            to="/profile" 
            className={({isActive}) => `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <User size={20} />
            <span>Hồ sơ cá nhân</span>
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">IoT Hub</span> / {getPageTitle()}
          </div>
          
          {/* Đồng hồ thời gian thực: yyyy/MM/dd hh:mm:ss */}
          <div className="flex items-center space-x-3 bg-purple-50 px-4 py-1.5 rounded-full border border-purple-100 shadow-sm">
            <Clock size={15} className="text-purple-600" />
            <span className="font-semibold text-xs text-purple-700 tracking-wide font-mono">
              {formatDateTime(time)}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
