import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useServiceCategories } from '../hooks/useServiceCategories';
import Modal from '../components/common/Modal';
import CategoryManagementModal from '../components/admin/CategoryManagementModal'; // 引入分類管理 Modal
import type { Service } from '../types/service';
import ImageUploader from '../components/admin/ImageUploader'; // 引入圖片上傳元件
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const ServiceManagement = () => {
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', category: '', platinumPrice: '', imageUrl: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false); // 控制服務 Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // 控制分類 Modal
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  // Fetch existing services
  const { services, isLoading: servicesLoading, error: servicesError } = useServices();
  
  // Fetch service categories
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useServiceCategories();

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        price: String(editingService.price),
        duration: String(editingService.duration),
        category: editingService.category,
        platinumPrice: String(editingService.platinumPrice || ''),
        imageUrl: editingService.imageUrl || '',
      });
    } else {
      resetForm();
    }
  }, [editingService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!formData.name || !formData.price || !formData.duration || !formData.category) {
      setFormError('所有欄位皆為必填');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        // Update existing service
        const serviceRef = doc(db, 'services', editingService.id);
        await updateDoc(serviceRef, {
          name: formData.name,
          price: Number(formData.price),
          duration: Number(formData.duration),
          category: formData.category,
          platinumPrice: formData.platinumPrice ? Number(formData.platinumPrice) : null,
          imageUrl: formData.imageUrl,
        });
        setSuccess(`服務項目 "${formData.name}" 已成功更新！`);
        setEditingService(null);
        setIsServiceModalOpen(false); // 更新成功後關閉 Modal
      } else {
        // Add new service
        await addDoc(collection(db, 'services'), {
          name: formData.name,
          price: Number(formData.price),
          duration: Number(formData.duration),
          category: formData.category,
          platinumPrice: formData.platinumPrice ? Number(formData.platinumPrice) : null,
          available: true, // New services are available by default
          imageUrl: formData.imageUrl,
          createdAt: serverTimestamp(),
        });
        setSuccess(`服務項目 "${formData.name}" 已成功新增！`);
        setIsServiceModalOpen(false); // 新增成功後關閉 Modal
      }
      resetForm();
    } catch (err) {
      console.error("Error adding service: ", err);
      setFormError('新增服務失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setIsServiceModalOpen(true); // 開啟 Modal 進行編輯
    // 不再需要滾動到頂部，因為表單在 Modal 中
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    resetForm();
    setIsServiceModalOpen(false); // 取消編輯時關閉 Modal
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', duration: '', category: '', platinumPrice: '', imageUrl: '' });
    setFormError(null);
  };

  const handleToggleAvailability = async (service: Service) => {
    setIsToggling(service.id);
    const serviceRef = doc(db, 'services', service.id);
    try {
      await updateDoc(serviceRef, { available: !service.available });
    } catch (err) {
      console.error("Error toggling availability: ", err);
      alert('更新狀態失敗！');
    } finally {
      setIsToggling(null);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`您確定要刪除服務項目 "${serviceName}" 嗎？此操作無法復原。`)) {
      return;
    }
    setIsDeleting(serviceId);
    try {
      const serviceRef = doc(db, 'services', serviceId);
      await deleteDoc(serviceRef);
      setSuccess(`服務項目 "${serviceName}" 已成功刪除！`);
      if (editingService?.id === serviceId) setEditingService(null); // If deleting the one being edited
    } catch (err) {
      console.error("Error deleting service: ", err);
      setFormError('刪除服務失敗，請稍後再試。');
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredServices = useMemo(() => {
    if (activeCategoryTab === 'all') {
      return services;
    }
    return services.filter(service => service.category === activeCategoryTab);
  }, [services, activeCategoryTab]);

  const categoryTabs = useMemo(() => ['all', ...categories.map(c => c.name)], [categories]);

  useEffect(() => {
    if (!categories.some(c => c.name === activeCategoryTab) && activeCategoryTab !== 'all') {
      setActiveCategoryTab('all');
    }
  }, [categories, activeCategoryTab]);
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            服務項目管理
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回預約列表
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 relative"> {/* Add relative for FAB positioning */}
        {/* Floating Action Button */}
        <button
          onClick={() => {
            setEditingService(null); // Reset for new service
            resetForm(); // Clear form fields
            setIsServiceModalOpen(true);
          }}
          className="fixed bottom-8 right-8 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-300 z-50"
          aria-label="新增服務項目"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        {/* Service Management Modal */}
        <Modal
          isOpen={isServiceModalOpen}
          onClose={handleCancelEdit} // 使用 handleCancelEdit 統一關閉邏輯
          title={editingService ? '編輯服務項目' : '新增服務項目'}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">服務名稱</label>
              <input type="text" id="name" value={formData.name} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">一般價格 (NT$)</label>
              <input type="number" id="price" value={formData.price} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="platinumPrice" className="block text-sm font-medium text-gray-700">
                白金會員價 (選填)
              </label>
              <input
                type="number"
                name="platinumPrice"
                id="platinumPrice"
                value={formData.platinumPrice || ''}
                onChange={handleFieldChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">服務時長 (分鐘)</label>
              <input type="number" id="duration" value={formData.duration} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">分類</label>
              <select
                id="category"
                value={formData.category}
                onChange={handleFieldChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="" disabled>請選擇分類</option>
                {/* 動態載入分類 */}
                {categoriesLoading ? (
                  <option>載入中...</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                )}
                {categoriesError && <option disabled>錯誤: {categoriesError}</option>}
              </select>
            </div>
            <ImageUploader
              label="服務圖片 (建議尺寸 400x400)"
              imageUrl={formData.imageUrl}
              onImageUrlChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              storagePath="services"
            />

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{success}</p>}

            <div className="pt-2 flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '處理中...' : (editingService ? '確認更新' : '確認新增')}
              </button>
              {editingService && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full px-4 py-3 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  取消編輯
                </button>
              )}
            </div>
          </form>
        </Modal>

        {/* Category Management Modal */}
        <CategoryManagementModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          services={services}
        />

        {/* 現有服務列表 */}
        <div className="max-w-2xl mx-auto">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">現有服務列表</h2>
              <div className="flex items-center gap-2">
                {categoriesError && <p className="text-xs text-red-500 hidden sm:block">分類載入失敗</p>}
                <button 
                  onClick={() => setIsCategoryModalOpen(true)} 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!!categoriesError || categoriesLoading}>
                  <PencilSquareIcon className="h-4 w-4" /> 編輯分類
                </button>
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                  {categoryTabs.map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setActiveCategoryTab(tabName)}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeCategoryTab === tabName ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      {tabName === 'all' ? '全部' : tabName}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            {servicesLoading && <div className="p-8 text-center"><LoadingSpinner /></div>}
            {servicesError && <p className="p-8 text-center text-red-500">讀取服務列表失敗。</p>}
            {!servicesLoading && !servicesError && (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服務名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格 (一般/白金)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時長(分)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-md object-cover" src={service.imageUrl || 'https://via.placeholder.com/150'} alt={service.name} />
                              </div>
                              <div className="ml-4">{service.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${service.price}
                            {service.platinumPrice && (
                              <span className="ml-2 text-yellow-600 font-bold">${service.platinumPrice}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.duration}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => handleToggleAvailability(service)} disabled={isToggling === service.id} className={`px-3 py-1 text-xs font-semibold rounded-full ${service.available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} disabled:opacity-50`}>
                              {isToggling === service.id ? '...' : (service.available ? '上架中' : '已下架')}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                            <button
                              onClick={() => handleEditClick(service)}
                              className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-300 disabled:cursor-not-allowed"
                              disabled={!!editingService || !!isDeleting}
                            >
                              編輯
                            </button>
                            <button onClick={() => handleDeleteService(service.id, service.name)} disabled={isDeleting === service.id || !!editingService} className="text-red-600 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed">
                              {isDeleting === service.id ? '刪除中...' : '刪除'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <div className="flex items-start mb-3">
                        <div className="flex-1 flex flex-row justify-between">
                          <h3 className="font-bold text-lg text-gray-800 break-words">{service.name}</h3>
                          <div className="flex justify-end items-center mb-2">
                        <button
                          onClick={() => handleEditClick(service)}
                          className="ml-4 flex-shrink-0 text-indigo-600 hover:text-indigo-900 disabled:text-gray-300"
                          disabled={!!editingService || !!isDeleting}
                        >
                          編輯
                        </button>
                        <button onClick={() => handleDeleteService(service.id, service.name)} disabled={isDeleting === service.id || !!editingService} className="ml-2 flex-shrink-0 text-red-600 hover:text-red-900 disabled:text-gray-300 disabled:cursor-not-allowed">
                          {isDeleting === service.id ? '刪除中...' : '刪除'}
                        </button>
                      </div>
                        </div>
                      </div>
                      <div className='flex flex-row'>
                        <div className="space-y-2 text-sm text-gray-600 border-t pt-2 mt-2">
                          <p><strong className="font-medium text-gray-700">分類:</strong> {service.category}</p>
                          <p><strong className="font-medium text-gray-700">一般價:</strong> ${service.price}</p>
                          {service.platinumPrice && (
                            <p className="text-yellow-700">
                              <strong className="font-medium text-yellow-600">白金價:</strong> ${service.platinumPrice}
                            </p>
                          )}
                          <p><strong className="font-medium text-gray-700">時長:</strong> {service.duration} 分鐘</p>
                          <div className="flex items-center pt-1">
                            <strong className="font-medium text-gray-700 mr-2">狀態:</strong>
                            <button onClick={() => handleToggleAvailability(service)} disabled={isToggling === service.id} className={`px-3 py-1 text-xs font-semibold rounded-full ${service.available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} disabled:opacity-50`}>
                              {isToggling === service.id ? '...' : (service.available ? '上架中' : '已下架')}
                            </button>
                          </div>
                        </div>
                        <div className='mt-2 pt-2 border-t flex-1 flex flex-col justify-center items-center'>
                          <p><strong className="font-medium text-gray-700">圖片:</strong></p>
                          {service.imageUrl && (<img className="h-28 w-28 rounded-md object-cover mr-4" src={service.imageUrl || 'https://via.placeholder.j6/150'} alt={service.name} />)}
                          
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
                {filteredServices.length === 0 && (
                  <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow-md">
                    <p>此分類下沒有服務項目。</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceManagement;