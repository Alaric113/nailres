import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import type { Service } from '../types/service';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ServiceManagement = () => {
  const [formData, setFormData] = useState({ name: '', price: '', duration: '', category: '', platinumPrice: '' });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  // Fetch existing services
  const { services, isLoading: servicesLoading, error: servicesError } = useServices();

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        price: String(editingService.price),
        duration: String(editingService.duration),
        category: editingService.category,
        platinumPrice: String(editingService.platinumPrice || ''),
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
        });
        setSuccess(`服務項目 "${formData.name}" 已成功更新！`);
        setEditingService(null);
      } else {
        // Add new service
        await addDoc(collection(db, 'services'), {
          name: formData.name,
          price: Number(formData.price),
          duration: Number(formData.duration),
          category: formData.category,
          platinumPrice: formData.platinumPrice ? Number(formData.platinumPrice) : null,
          available: true, // New services are available by default
          createdAt: serverTimestamp(),
        });
        setSuccess(`服務項目 "${formData.name}" 已成功新增！`);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', duration: '', category: '', platinumPrice: '' });
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
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {editingService ? '編輯服務項目' : '新增服務項目'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  name="platinumPrice" // name is not used, but good practice
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
                  <option value="美睫">美睫</option>
                  <option value="霧眉">霧眉</option>
                  <option value="美甲">美甲</option>
                </select>
              </div>

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
          </div>

          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">現有服務列表</h2>
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
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
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
                  {services.map((service) => (
                    <div key={service.id} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-800 flex-1 break-words pr-2">{service.name}</h3>
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
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ServiceManagement;