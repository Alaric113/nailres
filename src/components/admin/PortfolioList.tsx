import React from 'react';
import usePortfolioItems from '../../hooks/usePortfolioItems';
import LoadingSpinner from '../common/LoadingSpinner';
import type { PortfolioItem } from '../../types/portfolio';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface PortfolioListProps {
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void; // Passing full item
}

const PortfolioList: React.FC<PortfolioListProps> = ({ onEdit, onDelete }) => {
  const { portfolioItems, loading, error } = usePortfolioItems();

  if (loading) {
    return <LoadingSpinner text="載入作品集..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (portfolioItems.length === 0) {
    return <div className="text-gray-500 text-center p-4">目前沒有作品集項目。點擊「新增作品」來建立第一個作品！</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              預覽
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              標題
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              分類
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              啟用中
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {portfolioItems.map((item) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img src={item.imageUrls[0]} alt={item.title} className="h-16 w-16 object-cover rounded-md" />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 text-xs">
                    無圖片
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.category}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.isActive ? '是' : '否'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                  title="編輯"
                >
                  <PencilIcon className="h-5 w-5 inline" />
                </button>
                <button
                  onClick={() => onDelete(item)} // Pass full item
                  className="text-red-600 hover:text-red-900"
                  title="刪除"
                >
                  <TrashIcon className="h-5 w-5 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PortfolioList;
