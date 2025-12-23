import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

interface PortfolioItem {
  id: string;
  title: string;
  imageUrls: string[];
  category: string;
}

interface PortfolioImageSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

const PortfolioImageSelector: React.FC<PortfolioImageSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && items.length === 0) {
      const fetchPortfolio = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, 'portfolioItems'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const fetchedItems = snapshot.docs.map(doc => ({
             id: doc.id,
             ...doc.data()
          } as PortfolioItem));
          setItems(fetchedItems);
        } catch (err) {
          console.error("Failed to fetch portfolio:", err);
          setError("無法載入作品集");
        } finally {
          setLoading(false);
        }
      };
      fetchPortfolio();
    }
  }, [isOpen, items.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PhotoIcon className="w-6 h-6 text-[#9F9586]" />
            選擇作品集圖片
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FAF9F6]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center text-gray-500 py-10">目前沒有作品集資料</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.flatMap(item => 
                item.imageUrls?.map((url, idx) => (
                  <button 
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                        onSelect(url);
                        onClose();
                    }}
                    className="group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all hover:scale-[1.02]"
                  >
                    <img 
                      src={url} 
                      alt={item.title} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity">
                      <p className="text-white text-xs truncate font-medium">{item.title}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PortfolioImageSelector;
