import { useState } from 'react';
import Modal from '../components/common/Modal';
import PortfolioForm from '../components/admin/PortfolioForm';
import PortfolioList from '../components/admin/PortfolioList';
import type { PortfolioItem } from '../types/portfolio';
import { db } from '../lib/firebase'; // Import db
import { storage } from '../lib/firebase'; // Import storage
import { doc, deleteDoc } from 'firebase/firestore'; // Import Firestore delete functions
import { ref, deleteObject } from 'firebase/storage'; // Import Storage delete functions
import { useToast } from '../context/ToastContext'; // NEW IMPORT


import { useServiceCategories } from '../hooks/useServiceCategories'; // New import

const PortfolioManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { showToast } = useToast();
  
  // Fetch dynamic categories
  const { categories: fetchedCategories } = useServiceCategories();
  
  // Create tabs: 'All' + category names
  const categories = ['All', ...fetchedCategories.map(c => c.name)];

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  
  const handleDeleteItem = async (item: PortfolioItem) => {
    if (!window.confirm('您確定要刪除此作品集項目嗎？此操作無法恢復，所有相關圖片也將被刪除！')) return;

    try {
      // 1. Delete images from Firebase Storage
      if (item.imageUrls && item.imageUrls.length > 0) {
        for (const imageUrl of item.imageUrls) {
          if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef).catch(error => {
              console.warn(`Failed to delete image: ${imageUrl}`, error);
            });
          }
        }
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, 'portfolioItems', item.id));

      showToast('作品集項目已成功刪除！', 'success');
    } catch (error) {
      console.error('刪除作品集項目失敗：', error);
      showToast('刪除作品集項目失敗！', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden w-full max-w-[100vw]">
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">作品集管理</h2>
                    <p className="text-gray-500 text-sm mt-1">管理與展示您的服務成果作品。</p>
                </div>
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 bg-[#9F9586] text-white rounded-lg shadow-sm hover:bg-[#8a8175] transition-colors font-bold text-sm break-keep">
                + 新增作品
                </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide select-none">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                            selectedCategory === cat
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                        }`}
                    >
                        {cat === 'All' ? '全部' : cat}
                    </button>
                ))}
            </div>

            {/* Portfolio List */}
            <div className="bg-transparent rounded-none shadow-none">
                 <PortfolioList 
                    onEdit={handleEditItem} 
                    onDelete={handleDeleteItem} 
                    categoryFilter={selectedCategory}
                 />
            </div>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? '編輯作品' : '新增作品'}>
        <PortfolioForm 
          item={editingItem} 
          onClose={() => setIsModalOpen(false)}
          onSave={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default PortfolioManagementPage;
