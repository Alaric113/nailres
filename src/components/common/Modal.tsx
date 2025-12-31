import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string; // 新增可選的 maxWidth 屬性
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-gray-900 bg-opacity-50"
      onClick={onClose} // 點擊背景關閉
    >
      <div
        className={`relative w-full mx-4 my-6 sm:mx-auto ${maxWidth}`}
        onClick={(e) => e.stopPropagation()} // 阻止點擊 Modal 內容時關閉
      >
        {/*content*/}
        <div className="relative flex flex-col w-full bg-white border-0 rounded-lg shadow-lg outline-none focus:outline-none">
          {/*header*/}
          <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t">
            <h3 className="text-xl font-semibold text-gray-800">
              {title}
            </h3>
            <button
              className="p-1 ml-auto bg-transparent border-0 text-gray-700 opacity-70 float-right text-2xl leading-none font-semibold outline-none focus:outline-none"
              onClick={onClose}
            >
              <span className="block w-6 h-6 text-gray-700">×</span>
            </button>
          </div>
          {/*body*/}
          <div className="relative p-3 flex-auto max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
