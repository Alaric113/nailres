import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Modal from '../common/Modal';
import type { ServiceCategory } from '../../hooks/useServiceCategories';
import type { Service } from '../../types/service';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ServiceCategory[];
  services: Service[];
}

const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({ isOpen, onClose, categories, services }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast(); // NEW HOOK USAGE


  const resetForm = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setError(null);
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('分類名稱不能為空');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingCategory) {
        // Update
        if (editingCategory.name !== newCategoryName) {
           // If name changed, we need to update all services that use this category
           const batch = writeBatch(db);
           
           // 1. Update the category document
           const categoryRef = doc(db, 'serviceCategories', editingCategory.id);
           batch.update(categoryRef, { name: newCategoryName });

           // 2. Find all services using the old category name
           const servicesRef = collection(db, 'services');
           const q = query(servicesRef, where('category', '==', editingCategory.name));
           const querySnapshot = await getDocs(q);

           // 3. Update each service
           querySnapshot.forEach((doc) => {
             batch.update(doc.ref, { category: newCategoryName });
           });

           await batch.commit();
           showToast(`分類已更新，並同步更新了 ${querySnapshot.size} 個相關服務`, 'success');

        } else {
             // Name didn't change (rare case if id logic differs, but safe to keep simple update or just return)
             const categoryRef = doc(db, 'serviceCategories', editingCategory.id);
             await updateDoc(categoryRef, { name: newCategoryName });
        }
      } else {
        // Add
        await addDoc(collection(db, 'serviceCategories'), { name: newCategoryName });
        showToast('分類新增成功', 'success');
      }
      resetForm();
    } catch (err) {
      setError('操作失敗，請稍後再試');
      console.error(err);
      showToast('操作失敗', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: ServiceCategory) => {
    // Check if category is in use
    const isCategoryInUse = services.some(service => service.category === category.name);
    if (isCategoryInUse) {
      showToast(`無法刪除分類 "${category.name}"，因為尚有服務項目正在使用此分類。`, 'error');
      return;
    }

    if (window.confirm(`您確定要刪除分類 "${category.name}" 嗎？`)) {
      try {
        await deleteDoc(doc(db, 'serviceCategories', category.id));
        showToast(`分類 "${category.name}" 已成功刪除。`, 'success');
      } catch (err) {
        showToast('刪除失敗！', 'error');
        console.error(err);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="管理服務分類">
      <div className="space-y-6">
        {/* Add/Edit Form */}
        <form onSubmit={handleAddOrUpdate} className="flex items-center gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder={editingCategory ? '編輯分類名稱' : '新增分類名稱'}
            className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 disabled:bg-gray-300">
            {isSubmitting ? '...' : (editingCategory ? '更新' : '新增')}
          </button>
          {editingCategory && (
            <button type="button" onClick={resetForm} className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              取消
            </button>
          )}
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* Category List */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-700 mb-2">現有分類</h4>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <span className="text-gray-800">{cat.name}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setNewCategoryName(cat.name);
                    }}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManagementModal;
