import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const ActionHistory = () => {
  const [history, setHistory] = useState([]);
  
  // States cho các bộ lọc trên UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // States lưu cấu hình lọc đang áp dụng sau khi bấm SEARCH
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
      device: 'ALL',
      action: 'ALL',
      status: 'ALL'
  });

  // Pagination states: Hỗ trợ chọn Limit page (5, 10, 20, 50 bản ghi/trang)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_BASE}/history`);
        setHistory(res.data);
      } catch (error) {
        console.error('Error fetching action history:', error);
      }
    };
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hàm định dạng thời gian chuẩn: yyyy/MM/dd hh:mm:ss
  const formatDateTime = (dateInput) => {
    if (!dateInput) return '-';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSearch = () => {
      setAppliedSearchTerm(searchTerm);
      setAppliedFilters({
          device: filterDevice,
          action: filterAction,
          status: filterStatus
      });
      setCurrentPage(1); // Reset lại trang 1
  };

  // Logic Lọc (Filter & Search)
  const filteredHistory = history.filter(item => {
    // 1. Lọc theo 3 Dropdown (Tự động lọc tức thì theo state filterDevice, filterAction, filterStatus)
    const matchDevice = filterDevice === 'ALL' || item.device_id === filterDevice;
    const matchAction = filterAction === 'ALL' || item.action === filterAction;
    const matchStatus = filterStatus === 'ALL' || item.status === filterStatus;
    
    // 2. Tìm kiếm chuỗi đa từ khóa (Chỉ lọc khi appliedSearchTerm thay đổi, tức là khi bấm SEARCH)
    const searchTrimmed = appliedSearchTerm.toLowerCase().trim();
    if (searchTrimmed === '') return matchDevice && matchAction && matchStatus;

    const tokens = searchTrimmed.split(/[\s,]+/).filter(Boolean);
    const timeSentStr = formatDateTime(item.sent_at).toLowerCase();
    const timeSentVi = new Date(item.sent_at).toLocaleString('vi-VN').toLowerCase();
    const timeReplyStr = item.replied_at ? formatDateTime(item.replied_at).toLowerCase() : '';
    const timeReplyVi = item.replied_at ? new Date(item.replied_at).toLocaleString('vi-VN').toLowerCase() : '';
    const deviceIdStr = (item.device_id || '').toLowerCase();
    const deviceNameStr = (item.device_name || '').toLowerCase();
    const actionStr = (item.action || '').toLowerCase();
    const statusStr = (item.status || '').toLowerCase();

    const matchSearchTerm = tokens.every(token =>
      deviceIdStr.includes(token) ||
      deviceNameStr.includes(token) ||
      actionStr.includes(token) ||
      statusStr.includes(token) ||
      timeSentStr.includes(token) ||
      timeSentVi.includes(token) ||
      timeReplyStr.includes(token) ||
      timeReplyVi.includes(token)
    );

    return matchDevice && matchAction && matchStatus && matchSearchTerm;
  });

  // Khi người dùng chọn Dropdown thì reset về trang 1
  useEffect(() => {
      setCurrentPage(1);
  }, [filterDevice, filterAction, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
      if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Lịch sử hành động</h2>
        <div className="flex flex-wrap space-x-3 items-center">
          
          {/* Thiết bị Dropdown (Tự động lọc) */}
          <div className="relative">
              <select 
                  value={filterDevice}
                  onChange={(e) => setFilterDevice(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                  <option value="ALL">Tất cả thiết bị</option>
                  <option value="LED1">Đèn LED 1</option>
                  <option value="LED2">Đèn LED 2</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={16} />
          </div>

          {/* Hành động Dropdown (Tự động lọc) */}
          <div className="relative">
              <select 
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                  <option value="ALL">Tất cả hành động</option>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={16} />
          </div>

          {/* Trạng thái Dropdown (Tự động lọc) */}
          <div className="relative">
              <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ON">ON</option>
                  <option value="OFF">OFF</option>
                  <option value="LOADING">LOADING</option>
              </select>
              <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={16} />
          </div>

          {/* Text Search dời về sát nút SEARCH */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Tìm kiếm theo thời gian..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>

          {/* Nút Tìm kiếm */}
          <button 
            onClick={handleSearch}
            className="px-6 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50">
              <th className="py-3 px-4 font-semibold rounded-tl-lg">ID</th>
              <th className="py-3 px-4 font-semibold">TÊN THIẾT BỊ</th>
              <th className="py-3 px-4 font-semibold">HÀNH ĐỘNG</th>
              <th className="py-3 px-4 font-semibold">TRẠNG THÁI</th>
              <th className="py-3 px-4 font-semibold">THỜI GIAN BẬT</th>
              <th className="py-3 px-4 font-semibold rounded-tr-lg">THỜI GIAN PHẢN HỒI</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-900">{row.device_id}</td>
                <td className="py-4 px-4 text-gray-700">
                  {row.device_id === 'LED1' ? 'Đèn LED 1' : row.device_id === 'LED2' ? 'Đèn LED 2' : row.device_name}
                </td>
                <td className="py-4 px-4 font-medium text-gray-800">{row.action}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    row.status === 'ON' ? 'bg-green-100 text-green-700' :
                    row.status === 'OFF' ? 'bg-red-100 text-red-700' :
                    row.status === 'LOADING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-500 font-mono text-xs">
                  {formatDateTime(row.sent_at)}
                </td>
                <td className="py-4 px-4 text-gray-500 font-mono text-xs">
                  {row.replied_at ? formatDateTime(row.replied_at) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {currentData.length === 0 && (
          <div className="text-center py-10 text-gray-500">Không tìm thấy dữ liệu phù hợp</div>
        )}
      </div>

      {/* Phân trang: Hỗ trợ chọn Limit và các nút chuyển trang */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 pt-4 gap-3">
        {/* Lựa chọn Limit page & đếm tổng bản ghi */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Hiển thị:</span>
          <div className="relative">
            <select 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer shadow-2xs"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
            <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={15} />
          </div>
          <span className="text-xs text-gray-400 pl-1">
            ({filteredHistory.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredHistory.length)}` : '0'} / {filteredHistory.length} bản ghi)
          </span>
        </div>

        {/* Danh sách các nút số trang */}
        <div className="flex items-center space-x-1.5">
          {/* Nút Trước */}
          <button 
            onClick={prevPage} 
            disabled={currentPage === 1}
            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              currentPage === 1 
                ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-xs cursor-pointer'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Trước</span>
          </button>

          {/* Danh sách các nút số trang */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (totalPages > 7 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                if (Math.abs(page - currentPage) === 3) {
                  return <span key={page} className="px-1 text-gray-400">...</span>;
                }
                return null;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 scale-105'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          {/* Nút Sau */}
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages || totalPages === 0}
            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
              currentPage === totalPages || totalPages === 0 
                ? 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed' 
                : 'text-gray-700 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-xs cursor-pointer'
            }`}
          >
            <span>Sau</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionHistory;
