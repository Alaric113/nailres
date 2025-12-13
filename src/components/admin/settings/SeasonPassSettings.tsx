import { useState } from 'react';
import { useSeasonPasses } from '../../../hooks/useSeasonPasses';
import type { SeasonPass, SeasonPassVariant } from '../../../types/seasonPass';
import LoadingSpinner from '../../common/LoadingSpinner';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  XMarkIcon,
  PhotoIcon 
} from '@heroicons/react/24/outline';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../lib/firebase';

const SeasonPassSettings = () => {
  const { passes, loading, addPass, updatePass, deletePass } = useSeasonPasses();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<SeasonPass>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newPassForm, setNewPassForm] = useState<Partial<SeasonPass>>({
    name: '',
    duration: '3個月',
    variants: [],
    contentItems: [],
    note: '',
    imageUrl: '',
    color: 'from-[#9F9586] to-[#8a8173]',
    isActive: true,
    order: 0
  });

  // State for new variant input
  const [newVariant, setNewVariant] = useState<SeasonPassVariant>({ name: '', price: 0, originalPrice: 0 });

  const [newContentText, setNewContentText] = useState('');
  const [editContentText, setEditContentText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const colorOptions = [
    { name: '經典金', value: 'from-[#9F9586] to-[#8a8173]' },
    { name: '尊榮黑', value: 'from-[#5C5548] to-[#2d2a24]' },
    { name: '優雅米', value: 'from-[#EFECE5] to-[#dcd8cf] text-gray-800' },
    { name: '玫瑰金', value: 'from-[#eebfb8] to-[#d69e96]' },
  ];

  if (loading) return <div className="flex justify-center p-8"><LoadingSpinner /></div>;

  const handleEditClick = (pass: SeasonPass) => {
    setIsEditing(pass.id);
    setEditForm(pass);
    setEditContentText(pass.contentItems?.join('\n') || '');
  };

  const handleImageUpload = async (file: File, isEditMode: boolean = false) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `season_passes/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (isEditMode) {
        setEditForm(prev => ({ ...prev, imageUrl: downloadURL }));
      } else {
        setNewPassForm(prev => ({ ...prev, imageUrl: downloadURL }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("圖片上傳失敗");
    } finally {
      setIsUploading(false);
    }
  };

  const addVariantToNewPass = () => {
    if (!newVariant.name || !newVariant.price) return alert("請輸入規格名稱與價格");
    setNewPassForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
    setNewVariant({ name: '', price: 0, originalPrice: 0 });
  };

  const removeVariantFromNewPass = (index: number) => {
    setNewPassForm(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }));
  };

  const addVariantToEditPass = () => {
     // We'll reuse newVariant state for adding to edit form for simplicity, or create separate state if needed.
     // Let's create a local handler or use a temporary state if we want better UX, 
     // but reusing newVariant might be confusing if both forms are open (though currently they can't be strictly).
     // Actually, let's just add an empty variant directly to the edit form array and let user edit it in place?
     // Or better, just having inputs in the edit form.
     setEditForm(prev => ({
         ...prev,
         variants: [...(prev.variants || []), { name: '', price: 0, originalPrice: 0 }]
     }));
  };
  
  const updateEditVariant = (index: number, field: keyof SeasonPassVariant, value: string | number) => {
      setEditForm(prev => {
          const newVariants = [...(prev.variants || [])];
          newVariants[index] = { ...newVariants[index], [field]: value };
          return { ...prev, variants: newVariants };
      });
  };

  const removeVariantFromEditPass = (index: number) => {
      setEditForm(prev => ({
          ...prev,
          variants: (prev.variants || []).filter((_, i) => i !== index)
      }));
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updatePass(id, {
        ...editForm,
        contentItems: editContentText.split('\n').filter(item => item.trim() !== '')
      });
      setIsEditing(null);
    } catch (error) {
      alert('更新失敗');
    }
  };

  const handleAddPass = async () => {
    try {
      if (!newPassForm.name || (newPassForm.variants && newPassForm.variants.length === 0)) return alert('請填寫名稱並至少新增一個規格');
      await addPass({
        ...newPassForm as Omit<SeasonPass, 'id'>,
        contentItems: newContentText.split('\n').filter(item => item.trim() !== ''),
        order: passes.length + 1
      });
      setIsAdding(false);
      setNewPassForm({
        name: '',
        duration: '3個月',
        variants: [],
        contentItems: [],
        note: '',
        imageUrl: '',
        color: 'from-[#9F9586] to-[#8a8173]',
        isActive: true,
        order: 0
      });
      setNewContentText('');
      setNewVariant({ name: '', price: 0, originalPrice: 0 });
    } catch (error) {
      alert('新增失敗');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除此方案嗎？')) {
      await deletePass(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-serif font-bold text-gray-900">季卡/年卡方案設定</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 bg-[#9F9586] text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-[#8a8175] transition-colors"
        >
          <PlusIcon className="w-4 h-4" /> 新增方案
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-4 rounded-xl border border-[#EFECE5] shadow-sm mb-4 animate-fade-in">
          <h3 className="font-bold mb-3">新增方案</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="方案名稱 (例如: 初卡)" 
                  className="border p-2 rounded-lg w-full font-bold"
                  value={newPassForm.name}
                  onChange={e => setNewPassForm({...newPassForm, name: e.target.value})}
                />
            </div>
            
            {/* Variants Section for New Pass */}
            <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-bold text-gray-700 mb-2">價格規格</label>
                {/* List Existing Variants */}
                <div className="space-y-2 mb-3">
                    {newPassForm.variants?.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border">
                            <span className="font-bold flex-1">{v.name}</span>
                            <span className="text-gray-500 text-sm line-through">${v.originalPrice}</span>
                            <span className="text-red-500 font-bold">${v.price}</span>
                            <button onClick={() => removeVariantFromNewPass(idx)} className="text-red-400 hover:text-red-600">
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                {/* Add New Variant Input */}
                <div className="flex gap-2 items-end">
                    <input 
                        type="text" 
                        placeholder="規格 (如: 120本)" 
                        className="border p-2 rounded-lg w-1/3 text-sm"
                        value={newVariant.name}
                        onChange={e => setNewVariant({...newVariant, name: e.target.value})}
                    />
                     <input 
                        type="number" 
                        placeholder="原價" 
                        className="border p-2 rounded-lg w-1/4 text-sm"
                        value={newVariant.originalPrice || ''}
                        onChange={e => setNewVariant({...newVariant, originalPrice: Number(e.target.value)})}
                    />
                    <input 
                        type="number" 
                        placeholder="售價" 
                        className="border p-2 rounded-lg w-1/4 text-sm font-bold"
                        value={newVariant.price || ''}
                        onChange={e => setNewVariant({...newVariant, price: Number(e.target.value)})}
                    />
                    <button onClick={addVariantToNewPass} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-lg text-gray-600">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Image Upload for New Pass */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">方案圖片 (可選)</label>
                <div className="flex items-center gap-4">
                    {newPassForm.imageUrl ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={newPassForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                             <button 
                                onClick={() => setNewPassForm({...newPassForm, imageUrl: ''})}
                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                <XMarkIcon className="w-6 h-6" />
                             </button>
                        </div>
                    ) : (
                        <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                            <PhotoIcon className="w-8 h-8" />
                        </div>
                    )}
                    <div className="flex-1">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], false)}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#9F9586] file:text-white hover:file:bg-[#8a8175]"
                            disabled={isUploading}
                        />
                        {isUploading && <p className="text-xs text-[#9F9586] mt-1">上傳中...</p>}
                    </div>
                </div>
            </div>
            
             <input 
                type="text" 
                placeholder="效期 (預設: 3個月)" 
                className="border p-2 rounded-lg w-full"
                value={newPassForm.duration || ''}
                onChange={e => setNewPassForm({...newPassForm, duration: e.target.value})}
              />
             
             <div className="md:col-span-2">
                 <textarea 
                    placeholder="方案內容 (請一行一項，例如：&#10;3次完整睫毛嫁接&#10;3次補睫)"
                    className="border p-2 rounded-lg w-full h-24"
                    value={newContentText}
                    onChange={e => setNewContentText(e.target.value)}
                 />
             </div>
             <div className="md:col-span-2">
                <input 
                  type="text" 
                  placeholder="備註 (例如: 計價方式說明)" 
                  className="border p-2 rounded-lg w-full text-sm"
                  value={newPassForm.note || ''}
                  onChange={e => setNewPassForm({...newPassForm, note: e.target.value})}
                />
            </div>

             <select 
               className="border p-2 rounded-lg w-full"
               value={newPassForm.color}
               onChange={e => setNewPassForm({...newPassForm, color: e.target.value})}
             >
               {colorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
             </select>
             <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="newActive"
                  checked={newPassForm.isActive}
                  onChange={e => setNewPassForm({...newPassForm, isActive: e.target.checked})}
                />
                <label htmlFor="newActive">啟用</label>
             </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
            <button onClick={handleAddPass} className="px-3 py-1.5 bg-[#9F9586] text-white rounded-lg">確認新增</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {passes.map(pass => (
          <div key={pass.id} className="bg-white p-4 rounded-xl border border-[#EFECE5] shadow-sm flex flex-col items-start gap-4">
             {isEditing === pass.id ? (
               // Edit Mode
               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 flex gap-4">
                    <input 
                        type="text" 
                        className="border p-2 rounded-lg w-full font-bold"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  
                  {/* Variants Edit Section */}
                  <div className="md:col-span-2 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-gray-700">價格規格</label>
                        <button onClick={addVariantToEditPass} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">新增規格</button>
                    </div>
                    <div className="space-y-2">
                        {editForm.variants?.map((v, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input 
                                    type="text" 
                                    placeholder="規格"
                                    className="border p-1.5 rounded w-1/3 text-sm"
                                    value={v.name}
                                    onChange={e => updateEditVariant(idx, 'name', e.target.value)}
                                />
                                <input 
                                    type="number" 
                                    placeholder="原價"
                                    className="border p-1.5 rounded w-1/4 text-sm"
                                    value={v.originalPrice || ''}
                                    onChange={e => updateEditVariant(idx, 'originalPrice', Number(e.target.value))}
                                />
                                <input 
                                    type="number" 
                                    placeholder="售價"
                                    className="border p-1.5 rounded w-1/4 text-sm font-bold"
                                    value={v.price}
                                    onChange={e => updateEditVariant(idx, 'price', Number(e.target.value))}
                                />
                                <button onClick={() => removeVariantFromEditPass(idx)} className="text-red-400 hover:text-red-600">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                  </div>

                  {/* Image Upload for Edit Mode */}
                  <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">方案圖片</label>
                      <div className="flex items-center gap-4">
                          {editForm.imageUrl ? (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                  <img src={editForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                  <button 
                                      onClick={() => setEditForm({...editForm, imageUrl: ''})}
                                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                      <XMarkIcon className="w-6 h-6" />
                                  </button>
                              </div>
                          ) : (
                              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 text-gray-400">
                                  <PhotoIcon className="w-8 h-8" />
                              </div>
                          )}
                          <div className="flex-1">
                              <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0], true)}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#9F9586] file:text-white hover:file:bg-[#8a8175]"
                                  disabled={isUploading}
                              />
                              {isUploading && <p className="text-xs text-[#9F9586] mt-1">上傳中...</p>}
                          </div>
                      </div>
                  </div>

                   <input 
                      type="text" 
                      placeholder="效期"
                      className="border p-2 rounded-lg w-full"
                      value={editForm.duration || ''}
                      onChange={e => setEditForm({...editForm, duration: e.target.value})}
                    />
                   <div className="md:col-span-2">
                        <textarea 
                            className="border p-2 rounded-lg w-full h-24"
                            value={editContentText}
                            onChange={e => setEditContentText(e.target.value)}
                        />
                   </div>
                    <div className="md:col-span-2">
                        <input 
                        type="text" 
                        className="border p-2 rounded-lg w-full text-sm"
                        value={editForm.note || ''}
                        onChange={e => setEditForm({...editForm, note: e.target.value})}
                        />
                    </div>
                   <select 
                     className="border p-2 rounded-lg w-full"
                     value={editForm.color}
                     onChange={e => setEditForm({...editForm, color: e.target.value})}
                   >
                     {colorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
                   </select>
                   <div className="flex items-center gap-2">
                       <input 
                        type="checkbox" 
                        checked={editForm.isActive}
                        onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
                      />
                      <label>啟用</label>
                   </div>
                   <div className="flex justify-end gap-2 md:col-span-2">
                     <button onClick={() => setIsEditing(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-5 h-5"/></button>
                     <button onClick={() => handleSaveEdit(pass.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full"><CheckIcon className="w-5 h-5"/></button>
                   </div>
               </div>
             ) : (
               // View Mode
               <div className="flex w-full flex-col md:flex-row gap-4 items-start md:items-center">
                 {/* Image Preview in List */}
                 {pass.imageUrl ? (
                     <img src={pass.imageUrl} alt={pass.name} className="w-16 h-16 shrink-0 rounded-lg object-cover border border-gray-100" />
                 ) : (
                     <div className={`w-16 h-16 shrink-0 rounded-lg bg-gradient-to-br ${pass.color}`}></div>
                 )}
                 
                 <div className="flex-1 w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">
                                {pass.name} 
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">效期: {pass.duration}</p>
                        </div>
                    </div>

                    {/* Variants Tag Cloud */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {pass.variants?.map((v, i) => (
                            <span key={i} className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-600">
                                {v.name}: ${v.price}
                            </span>
                        ))}
                    </div>

                   <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                       <ul className="list-disc list-inside space-y-0.5">
                           {pass.contentItems && pass.contentItems.slice(0, 3).map((item, idx) => (
                               <li key={idx} className="truncate">{item}</li>
                           ))}
                           {(pass.contentItems?.length || 0) > 3 && <li className="list-none pl-4 text-gray-400">...以及更多</li>}
                       </ul>
                   </div>
                   
                   {!pass.isActive && <div className="mt-2 inline-block px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">已停用</div>}
                 </div>
                 <div className="flex gap-2 md:flex-col shrink-0">
                   <button onClick={() => handleEditClick(pass)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors">
                     <PencilIcon className="w-5 h-5" />
                   </button>
                   <button onClick={() => handleDelete(pass.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                     <TrashIcon className="w-5 h-5" />
                   </button>
                 </div>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeasonPassSettings;
