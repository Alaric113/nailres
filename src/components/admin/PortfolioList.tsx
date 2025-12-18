import React, { useMemo } from 'react';
import usePortfolioItems from '../../hooks/usePortfolioItems';
import LoadingSpinner from '../common/LoadingSpinner';
import type { PortfolioItem } from '../../types/portfolio';
import { PencilSquareIcon, TrashIcon, UserIcon, CalendarIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface PortfolioListProps {
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  categoryFilter: string; // 'All' | '美甲' | '美睫' | '霧眉'
}

const PortfolioList: React.FC<PortfolioListProps> = ({ onEdit, onDelete, categoryFilter }) => {
  const { portfolioItems, loading, error } = usePortfolioItems();

  const filteredItems = useMemo(() => {
    if (categoryFilter === 'All') return portfolioItems;
    return portfolioItems.filter(item => item.category === categoryFilter);
  }, [portfolioItems, categoryFilter]);

  if (loading) {
    return (
        <div className="flex justify-center p-12">
            <LoadingSpinner text="載入作品集..." />
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 bg-red-50 rounded-xl">{error}</div>;
  }

  if (filteredItems.length === 0) {
    return (
        <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">在此分類下沒有作品集項目</p>
        </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredItems.map((item) => (
        <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex gap-4 hover:shadow-md transition-shadow group h-full">
            {/* Image Section - Compact & Left Aligned */}
            <div className="relative w-24 h-full min-h-[120px] flex-shrink-0 self-stretch">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">
                        無圖
                    </div>
                )}
                 {/* Status Indicator (Dot) */}
                 <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${item.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{item.title}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium whitespace-nowrap">
                            {item.category}
                        </span>
                    </div>

                    {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{item.description}</p>
                    )}

                    {/* Source Info Block - Enhanced */}
                    {item.orderId ? (
                         <div className="text-[10px] text-gray-500 space-y-1 bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-1.5 truncate">
                                <UserIcon className="w-3 h-3 text-gray-400" />
                                <span className="font-medium text-gray-700">{item.customerName || '未知客戶'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                                <SparklesIcon className="w-3 h-3 text-gray-400" />
                                <span>{item.designerName || '未知設計師'}</span>
                            </div>
                             <div className="flex items-center gap-1.5 truncate">
                                <CalendarIcon className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-400">
                                    {item.bookingDate ? format(item.bookingDate.toDate(), 'yyyy/MM/dd HH:mm') : '未知時間'}
                                </span>
                            </div>
                         </div>
                    ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">手動建立</span>
                    )}
                </div>

                {/* Actions - Bottom Right */}
                <div className="flex justify-end gap-2 mt-2 pt-1">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-[#9F9586] hover:bg-[#9F9586]/10 rounded-md transition-colors"
                        title="編輯"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="刪除"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioList;
