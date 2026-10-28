import React, { useState } from 'react';
import { User, GraduationCap, ExternalLink, Copy, Check, Edit2, Save } from 'lucide-react';

const Profile = () => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [links, setLinks] = useState(() => {
    const saved = localStorage.getItem('iot_student_links');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      github: 'https://github.com/Phamthang-25/IoT-Hub',
      figma: 'https://www.figma.com/design/WduP7mfo8tzxjTTMAboAv0/DataIoT?node-id=1669-162202&t=kdQXSrqFp4OLGpPo-1',
      postman: 'https://documenter.getpostman.com/view/51589237/2sBYHVvyoe'
    };
  });

  const [tempLinks, setTempLinks] = useState(links);

  const copyStudentId = () => {
    navigator.clipboard.writeText('B23DCAT274');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setLinks(tempLinks);
    localStorage.setItem('iot_student_links', JSON.stringify(tempLinks));
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7.5rem)] py-6">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Cover */}
        <div className="h-36 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 relative">
          <button
            onClick={() => {
              setTempLinks(links);
              setIsEditing(!isEditing);
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/35 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Chỉnh sửa link"
          >
            <Edit2 size={14} />
            <span>{isEditing ? 'Đóng' : 'Sửa link'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="px-10 pb-10 relative flex flex-col items-center">
          {/* Avatar */}
          <div className="w-28 h-28 bg-white p-2 rounded-full -mt-14 shadow-lg mb-4">
            <div className="w-full h-full bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <User size={48} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Phạm Bá Thắng</h2>
          <div className="flex items-center text-purple-700 text-sm font-semibold mt-1.5 mb-6 bg-purple-50 px-4 py-1.5 rounded-full">
            <GraduationCap size={18} className="mr-2" />
            <span>Sinh viên thực hiện</span>
          </div>

          {/* Form chỉnh sửa nếu bật isEditing */}
          {isEditing ? (
            <div className="w-full space-y-4 pt-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link GitHub</label>
                <input
                  type="text"
                  value={tempLinks.github}
                  onChange={(e) => setTempLinks({ ...tempLinks, github: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link Figma</label>
                <input
                  type="text"
                  value={tempLinks.figma}
                  onChange={(e) => setTempLinks({ ...tempLinks, figma: e.target.value })}
                  placeholder="https://www.figma.com/..."
                  className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link Postman API</label>
                <input
                  type="text"
                  value={tempLinks.postman}
                  onChange={(e) => setTempLinks({ ...tempLinks, postman: e.target.value })}
                  placeholder="https://documenter.getpostman.com/..."
                  className="w-full px-4 py-2.5 text-sm font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Save size={15} />
                  <span>Lưu link</span>
                </button>
              </div>
            </div>
          ) : (
            /* Thông tin chi tiết - 5 mục to rõ, thoáng đãng, sang trọng */
            <div className="w-full divide-y divide-gray-100">
              {/* Họ và tên */}
              <div className="py-4.5 flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Họ và tên</span>
                <span className="font-bold text-gray-900 text-base">Phạm Bá Thắng</span>
              </div>

              {/* Mã sinh viên */}
              <div className="py-4.5 flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Mã sinh viên</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-purple-700 font-mono text-lg tracking-wide">B23DCAT274</span>
                  <button
                    onClick={copyStudentId}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                    title="Sao chép MSV"
                  >
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Link GitHub */}
              <div className="py-4.5 flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Link GitHub</span>
                <a
                  href={links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center space-x-1.5 transition-colors"
                >
                  <span className="max-w-[320px] truncate">{links.github.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Link Figma */}
              <div className="py-4.5 flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Link Figma</span>
                <a
                  href={links.figma}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center space-x-1.5 transition-colors"
                >
                  <span className="max-w-[320px] truncate">{links.figma.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Link Postman API */}
              <div className="py-4.5 flex justify-between items-center">
                <span className="text-gray-500 text-base font-medium">Link Postman API</span>
                <a
                  href={links.postman}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center space-x-1.5 transition-colors"
                >
                  <span className="max-w-[320px] truncate">{links.postman.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}

          {/* Trạng thái đơn giản */}
          <div className="mt-8 px-5 py-2 bg-green-50 text-green-700 font-semibold rounded-full text-sm flex items-center border border-green-200/60 shadow-xs">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            Tài khoản đang hoạt động
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
