import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/common/Modal';
import PortfolioForm from '../components/admin/PortfolioForm';
import PortfolioList from '../components/admin/PortfolioList';
import type { PortfolioItem } from '../types/portfolio';
import { db } from '../lib/firebase'; // Import db
import { storage } from '../lib/firebase'; // Import storage
import { doc, deleteDoc } from 'firebase/firestore'; // Import Firestore delete functions
import { ref, deleteObject } from 'firebase/storage'; // Import Storage delete functions


const PortfolioManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

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
          if (imageUrl) { // Ensure URL is not empty
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef).catch(error => {
              console.warn(`Failed to delete image: ${imageUrl}`, error);
              // Don't stop the whole process if one image fails to delete, try to continue.
            });
          }
        }
      }

      // 2. Delete document from Firestore
      await deleteDoc(doc(db, 'portfolioItems', item.id));

      alert('作品集項目已成功刪除！');
    } catch (error) {
      console.error('刪除作品集項目失敗：', error);
      alert('刪除作品集項目失敗！');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            作品集管理
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員後台
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">作品列表</h2>
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              + 新增作品
            </button>
          </div>
          <PortfolioList onEdit={handleEditItem} onDelete={handleDeleteItem} />
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
