import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useServices } from '../hooks/useServices';
import { useServiceCategories } from '../hooks/useServiceCategories';
import Modal from '../components/common/Modal';
import CategoryManagementModal from '../components/admin/CategoryManagementModal'; // 引入分類管理 Modal
import type { Service, ServiceOption } from '../types/service'; // Import ServiceOption
import ImageUploader from '../components/admin/ImageUploader'; // 引入圖片上傳元件
import LoadingSpinner from '../components/common/LoadingSpinner';
import ServiceMobileAccordionCard from '../components/admin/ServiceMobileAccordionCard'; // Import the new component
import ServiceOptionEditor from '../components/admin/ServiceOptionEditor'; // Import Option Editor
import { PencilSquareIcon, EyeIcon, EyeSlashIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../context/ToastContext'; // NEW IMPORT

const ServiceManagement = () => {
  // Add options to formData
  const [formData, setFormData] = useState<{
    name: string;
    price: string;
    duration: string;
    category: string;
    platinumPrice: string;
    imageUrl: string;
    description: string; // Add description here
    options: ServiceOption[];
  }>({ name: '', price: '', duration: '', category: '', platinumPrice: '', imageUrl: '', description: '', options: [] });
  
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false); // 控制服務 Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // 控制分類 Modal
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'basic' | 'image' | 'options'>('basic'); // Tab state
  // Fetch existing services
  const { services, isLoading: servicesLoading, error: servicesError } = useServices();
  
  // Fetch service categories
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useServiceCategories();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        price: String(editingService.price),
        duration: String(editingService.duration),
        category: editingService.category,
        platinumPrice: String(editingService.platinumPrice || ''),
        imageUrl: editingService.imageUrl || '',
        description: editingService.description || '',
        options: editingService.options || [],
      });
    } else {
      resetForm();
    }
    // Reset tab to basic when opening/editing
     if (isServiceModalOpen) setActiveTab('basic');
  }, [editingService, isServiceModalOpen]);

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
          options: formData.options, // Save options
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
          options: formData.options, // Save options
        });
        setSuccess(`服務項目 "${formData.name}" 已成功新增！`);
        showToast(`服務項目 "${formData.name}" 已成功新增！`, 'success');
        setIsServiceModalOpen(false); // 新增成功後關閉 Modal
      }
      resetForm();
    } catch (err) {
      console.error("Error adding service: ", err);
      setFormError('新增服務失敗，請稍後再試。');
      showToast('操作失敗，請稍後再試。', 'error');
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
    setFormData({ name: '', price: '', duration: '', category: '', platinumPrice: '', imageUrl: '', description: '', options: [] });
    setFormError(null);
  };

  const handleToggleAvailability = async (service: Service) => {
    setIsToggling(service.id);
    const serviceRef = doc(db, 'services', service.id);
    try {
      await updateDoc(serviceRef, { available: !service.available });
      showToast(`服務項目 "${service.name}" 狀態已更新。`, 'success');
    } catch (err) {
      console.error("Error toggling availability: ", err);
      showToast('更新狀態失敗！', 'error');
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
      showToast(`服務項目 "${serviceName}" 已成功刪除！`, 'success');
      if (editingService?.id === serviceId) setEditingService(null); // If deleting the one being edited
    } catch (err) {
      console.error("Error deleting service: ", err);
      setFormError('刪除服務失敗，請稍後再試。');
      showToast('刪除服務失敗，請稍後再試。', 'error');
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
    <div className="min-h-screen bg-secondary-light pb-24 relative overflow-x-hidden w-full max-w-[100vw]">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-text-main max-w-full">
        {/* Floating Action Button - Positioned above bottom nav on mobile */}
        {/* ... (keep existing button code) ... */}
        <button
          onClick={() => {
            setEditingService(null); // Reset for new service
            resetForm(); // Clear form fields
            setIsServiceModalOpen(true);
          }}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 z-50"
          aria-label="新增服務項目"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

        {/* ... (Modals remain the same) ... */}
        <Modal
          isOpen={isServiceModalOpen}
          onClose={handleCancelEdit} // 使用 handleCancelEdit 統一關閉邏輯
          title={editingService ? '編輯服務項目' : '新增服務項目'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                基本資訊
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'image'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                服務圖片
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'options'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                附加選項
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-1">
              
              {/* Basic Info Tab */}
              <div className={activeTab === 'basic' ? 'space-y-6' : 'hidden'}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-main">服務名稱</label>
                  <input type="text" id="name" value={formData.name} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-text-main">一般價格 (NT$)</label>
                    <input type="number" id="price" value={formData.price} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="platinumPrice" className="block text-sm font-medium text-text-main">
                      白金會員價 (選填)
                    </label>
                    <input
                      type="number"
                      name="platinumPrice"
                      id="platinumPrice"
                      value={formData.platinumPrice || ''}
                      onChange={handleFieldChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-text-main">服務時長 (分鐘)</label>
                    <input type="number" id="duration" value={formData.duration} onChange={handleFieldChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-text-main">分類</label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={handleFieldChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    >
                      <option value="" disabled>請選擇分類</option>
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
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-text-main">服務描述 / 注意事項 (選填)</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="例如：本店卸甲免費，他店卸甲+200... (此資訊將顯示在預約選單中)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">此內容將顯示在預約時的服務詳情中。</p>
                </div>
              </div>

              {/* Image Tab */}
              <div className={activeTab === 'image' ? 'py-4' : 'hidden'}>
                <ImageUploader
                  label="服務圖片 (建議尺寸 400x400)"
                  imageUrl={formData.imageUrl}
                  onImageUrlChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                  storagePath="services"
                />
              </div>

              {/* Options Tab */}
              <div className={activeTab === 'options' ? 'py-2' : 'hidden'}>
                <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <p className="text-sm text-blue-800">在此設定加購項目或變體（例如：卸甲、延甲、顏色選擇等）。</p>
                </div>
                <ServiceOptionEditor
                  options={formData.options}
                  onChange={(options) => setFormData(prev => ({ ...prev, options }))}
                />
              </div>

            </div>

            {formError && <p className="text-sm text-red-600 mb-2 px-1">{formError}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md mb-2 mx-1">{success}</p>}

            <div className="pt-6 border-t border-gray-100 flex gap-4 mt-auto">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-3 font-semibold text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isSubmitting ? '處理中...' : (editingService ? '儲存變更' : '確認新增')}
              </button>
              {editingService && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full px-4 py-3 font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                  取消
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
        <div className="max-w-full mx-auto">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-serif">現有服務列表</h2>
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-2">
                {categoriesError && <p className="text-xs text-red-500">分類載入失敗</p>}
                <button 
                  onClick={() => setIsCategoryModalOpen(true)} 
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                  disabled={!!categoriesError || categoriesLoading}>
                  <PencilSquareIcon className="h-4 w-4" /> 編輯分類
                </button>
              </div>
            </div>
            
            {/* Category Tabs */}
            <div className="mb-6">
              <div className="border-b border-secondary-dark/30">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                  {categoryTabs.map((tabName) => (
                    <button
                      key={tabName}
                      onClick={() => setActiveCategoryTab(tabName)}
                      className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeCategoryTab === tabName 
                          ? 'border-primary text-primary font-bold' 
                          : 'border-transparent text-text-light hover:text-text-main hover:border-secondary-dark'
                      }`}
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
                <div className="hidden md:block bg-white shadow-sm border border-secondary-dark rounded-xl overflow-hidden">
                  <table className="min-w-full divide-y divide-secondary-light">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">服務名稱</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">價格 (一般/白金)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">時長(分)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">分類</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">狀態</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">操作</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-secondary-light">
                      {filteredServices.map((service) => (
                        <tr key={service.id} className="hover:bg-secondary-light/20 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-text-main break-words max-w-xs">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-md object-cover border border-secondary-dark/20" src={service.imageUrl || 'https://via.placeholder.com/150'} alt={service.name} />
                              </div>
                              <div className="ml-4">{service.name}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                            ${service.price}
                            {service.platinumPrice && (
                              <span className="ml-2 text-accent font-bold">${service.platinumPrice}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{service.duration}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">{service.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => handleToggleAvailability(service)} disabled={isToggling === service.id} className={`px-3 py-1 text-xs font-semibold rounded-full ${service.available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} disabled:opacity-50`}
                            aria-label={service.available ? '下架服務' : '上架服務'}>
                              {isToggling === service.id ? '...' : (service.available ? <EyeIcon className="h-4 w-4 inline-block mr-1" /> : <EyeSlashIcon className="h-4 w-4 inline-block mr-1" />)}
                              {isToggling === service.id ? '' : (service.available ? '上架中' : '已下架')}
                            </button>
                          </td>
                          <td className="px-6 py-6 whitespace-nowrap text-sm font-medium flex gap-2 items-center">
                            <button
                              onClick={() => handleEditClick(service)}
                              className="text-primary p-2 rounded-full hover:bg-secondary-dark/20 disabled:text-gray-300 disabled:cursor-not-allowed"
                              disabled={!!editingService || !!isDeleting}
                              aria-label="編輯服務"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleDeleteService(service.id, service.name)} disabled={isDeleting === service.id || !!editingService} className="text-red-500 p-2 rounded-full hover:bg-secondary-dark/20 disabled:text-gray-300 disabled:cursor-not-allowed"
                            aria-label="刪除服務">
                              {isDeleting === service.id ? '...' : <TrashIcon className="h-5 w-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Accordion Card View */}
                <div className="md:hidden space-y-4">
                  {filteredServices.map((service) => (
                    <ServiceMobileAccordionCard key={service.id} service={service}
                      handleEditClick={handleEditClick}
                      handleDeleteService={handleDeleteService}
                      handleToggleAvailability={handleToggleAvailability}
                      isToggling={isToggling}
                      isDeleting={isDeleting}
                      editingService={editingService}
                    />
                  ))}
                </div>
                {filteredServices.length === 0 && (
                  <div className="text-center py-10 text-text-light bg-white rounded-lg shadow-sm border border-dashed border-secondary-dark">
                    <p>此分類下沒有服務項目。</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;