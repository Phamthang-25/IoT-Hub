import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const SensorData = () => {
  const [data, setData] = useState([]);
  
  // States cho các bộ lọc trên UI (chưa áp dụng cho đến khi bấm SEARCH)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCode, setFilterCode] = useState('ALL');
  const [searchOption, setSearchOption] = useState('ALL'); // 'ALL', 'CB Nhiệt độ', 'CB Độ ẩm', 'CB Ánh sáng', 'TIME'

  // States lưu cấu hình ĐÃ ÁP DỤNG sau khi bấm SEARCH
  const [appliedFilters, setAppliedFilters] = useState({
    code: 'ALL',
    option: 'ALL',
    term: ''
  });

  // Pagination states: Hỗ trợ chọn Limit page (5, 10, 20, 50 bản ghi/trang)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sensors`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching sensor data:', error);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Chỉ khi ấn SEARCH (hoặc Enter) mới áp dụng các tiêu chí lọc
  const handleSearch = () => {
    setAppliedFilters({
      code: filterCode,
      option: searchOption,
      term: searchTerm
    });
    setCurrentPage(1); // Reset lại trang 1 sau khi tìm kiếm
  };

  // Placeholder linh hoạt theo option được chọn trên UI
  const getSearchPlaceholder = () => {
    switch (searchOption) {
      case 'TIME':
        return 'Tìm theo thời gian (VD: 20:47, 12/10)...';
      case 'CB Nhiệt độ':
        return 'Tìm giá trị nhiệt độ (VD: 32)...';
      case 'CB Độ ẩm':
        return 'Tìm giá trị độ ẩm (VD: 62)...';
      case 'CB Ánh sáng':
        return 'Tìm giá trị ánh sáng (VD: 75)...';
      default:
        return 'Tìm theo giá trị...';
    }
  };

  // Logic Lọc (Chỉ lọc theo cấu hình appliedFilters sau khi bấm SEARCH)
  const filteredData = data.filter(item => {
    // 1. Lọc theo Dropdown Mã cảm biến đã áp dụng
    const matchCode = appliedFilters.code === 'ALL' || item.sensor_code === appliedFilters.code;

    const searchTrimmed = appliedFilters.term.trim().toLowerCase();

    // 2. Nếu option là THỜI GIAN -> Ô tìm kiếm tìm theo thời gian
    if (appliedFilters.option === 'TIME') {
      const timeFormattedVi = new Date(item.created_at).toLocaleString('vi-VN').toLowerCase();
      const timeIso = new Date(item.created_at).toISOString().toLowerCase();
      const matchTime = searchTrimmed === '' || timeFormattedVi.includes(searchTrimmed) || timeIso.includes(searchTrimmed);
      return matchCode && matchTime;
    }

    // 3. Nếu option là TÊN CẢM BIẾN (Nhiệt độ, Độ ẩm, Ánh sáng) -> Lọc cảm biến đó VÀ ô tìm kiếm tìm theo GIÁ TRỊ của cảm biến đó
    if (appliedFilters.option === 'CB Nhiệt độ' || appliedFilters.option === 'CB Độ ẩm' || appliedFilters.option === 'CB Ánh sáng') {
      const matchSensorName = item.sensor_name === appliedFilters.option;
      const itemValStr = item.value !== undefined && item.value !== null ? item.value.toString().toLowerCase() : '';
      const matchValue = searchTrimmed === '' || itemValStr.includes(searchTrimmed);
      return matchCode && matchSensorName && matchValue;
    }

    // 4. Mặc định 'ALL' (Tất cả tên cảm biến) -> Ô tìm kiếm tìm theo giá trị
    const itemValStr = item.value !== undefined && item.value !== null ? item.value.toString().toLowerCase() : '';
    const matchValue = searchTrimmed === '' || itemValStr.includes(searchTrimmed);
    return matchCode && matchValue;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Dữ liệu cảm biến</h2>
        <div className="flex flex-wrap space-x-3 items-center">
          
          {/* Bộ lọc Mã cảm biến */}
          <div className="relative">
            <select 
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              <option value="ALL">Tất cả mã cảm biến</option>
              <option value="TER01">TER01</option>
              <option value="MOIS01">MOIS01</option>
              <option value="LIGHT01">LIGHT01</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={16} />
          </div>

          {/* Option tìm kiếm: Chọn tên cảm biến (tìm theo giá trị) hoặc Thời gian (tìm theo thời gian) */}
          <div className="relative">
            <select 
              value={searchOption}
              onChange={(e) => setSearchOption(e.target.value)}
              className="appearance-none px-4 py-2 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả tên cảm biến</option>
              <option value="CB Nhiệt độ">CB Nhiệt độ</option>
              <option value="CB Độ ẩm">CB Độ ẩm</option>
              <option value="CB Ánh sáng">CB Ánh sáng</option>
              <option value="TIME">Thời gian</option>
            </select>
            <ChevronDown className="absolute right-2 top-2.5 text-gray-500 pointer-events-none" size={16} />
          </div>

          {/* Duy nhất 1 ô tìm kiếm */}
          <div className="relative">
            <input 
              type="text" 
              placeholder={getSearchPlaceholder()} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
          </div>

          {/* Nút Tìm kiếm */}
          <button 
            onClick={handleSearch}
            className="px-6 py-2 bg-purple-600 text-white font-medium text-sm rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
          >
            SEARCH
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 bg-gray-50">
              <th className="py-3 px-4 font-semibold rounded-tl-lg">MÃ CẢM BIẾN</th>
              <th className="py-3 px-4 font-semibold">TÊN CẢM BIẾN</th>
              <th className="py-3 px-4 font-semibold">GIÁ TRỊ</th>
              <th className="py-3 px-4 font-semibold rounded-tr-lg">THỜI GIAN</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4 font-medium text-gray-900">{row.sensor_code}</td>
                <td className="py-4 px-4 text-gray-600">{row.sensor_name}</td>
                <td className={`py-4 px-4 font-semibold ${row.sensor_type === 'TEMPERATURE' ? 'text-red-500' : row.sensor_type === 'HUMIDITY' ? 'text-blue-500' : 'text-yellow-600'}`}>
                  {row.value}
                </td>
                <td className="py-4 px-4 text-gray-500">
                  {new Date(row.created_at).toLocaleString('vi-VN')}
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
            ({filteredData.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredData.length)}` : '0'} / {filteredData.length} bản ghi)
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

export default SensorData;
