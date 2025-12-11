import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import type { Designer } from '../types/designer';
import type { EnrichedUser } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const StaffManagementPage: React.FC = () => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [staffUsers, setStaffUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // We will edit a "Combined" object or just the Designer part, 
  // but we need to know which User it belongs to.
  // Let's store the target User and the existing Designer (if any).
  const [editingTarget, setEditingTarget] = useState<{ user: EnrichedUser; designer?: Designer } | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    title: string;
    bio: string;
    isActive: boolean;
  }>({ name: '', title: '', bio: '', isActive: true });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Users with role 'manager' or 'designer'
        // Using client-side filter as per previous fix to avoid index issues
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const loadedStaffUsers = usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser))
            .filter(u => ['manager', 'designer'].includes(u.role));
        
        setStaffUsers(loadedStaffUsers);

        // 2. Fetch All Designer Profiles
        const designersRef = collection(db, 'designers');
        const designersSnapshot = await getDocs(designersRef);
        const loadedDesigners = designersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer));
        setDesigners(loadedDesigners);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (user: EnrichedUser, designer?: Designer) => {
    setEditingTarget({ user, designer });
    setFormData({
      name: designer?.name || user.profile.displayName || '',
      title: designer?.title || '',
      bio: designer?.bio || '',
      isActive: designer?.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingTarget) return;
    if (!formData.name) return alert("請輸入顯示名稱");

    const { user, designer } = editingTarget;
    
    // Use existing ID or generate new one
    // Note: We could use user.id as designer.id for simplicity, but keeping UUID is safer for migration
    const docId = designer?.id || uuidv4();

    const newDesignerData: Designer = {
      id: docId,
      name: formData.name,
      title: formData.title,
      bio: formData.bio,
      isActive: formData.isActive,
      linkedUserId: user.id, // Strictly link to this user
      displayOrder: designer?.displayOrder || 99, // Keep existing order or put at end
      avatarUrl: user.profile.avatarUrl || undefined, // Sync avatar from User
    };

    try {
      await setDoc(doc(db, 'designers', docId), newDesignerData);
      
      // Update local state
      setDesigners(prev => {
        const others = prev.filter(d => d.id !== docId);
        return [...others, newDesignerData];
      });
      
      setIsModalOpen(false);
      setEditingTarget(null);
    } catch (error) {
      console.error("Error saving designer:", error);
      alert("儲存失敗");
    }
  };

  const handleDeleteProfile = async (designerId: string) => {
    if (!window.confirm("確定要移除此設計師檔案嗎？(這不會刪除使用者帳號，只會移除預約頁面上的顯示)")) return;
    try {
      await deleteDoc(doc(db, 'designers', designerId));
      setDesigners(prev => prev.filter(d => d.id !== designerId));
    } catch (error) {
      console.error("Error deleting profile:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">設計師管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理具有「設計師」或「管理設計師」身分的使用者檔案。
            <br/>
            如需新增設計師，請至「用戶管理」將該使用者身分設定為設計師。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffUsers.map(user => {
            // Find linked designer profile
            const designer = designers.find(d => d.linkedUserId === user.id);
            const hasProfile = !!designer;

            return (
                <div key={user.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col transition-all hover:shadow-md ${hasProfile && designer.isActive ? 'border-[#EFECE5]' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-secondary-light flex items-center justify-center text-[#9F9586] text-xl font-bold border border-[#EFECE5] overflow-hidden">
                                {user.profile.avatarUrl ? (
                                    <img src={user.profile.avatarUrl} alt={user.profile.displayName || ''} className="h-full w-full object-cover" />
                                ) : (
                                    (user.profile.displayName || '?')[0]
                                )}
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {designer?.name || user.profile.displayName}
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === 'manager' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {user.role === 'manager' ? '管理設計師' : '設計師'}
                                    </span>
                                    {designer?.title && (
                                        <span className="text-sm text-gray-500">{designer.title}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        {hasProfile ? (
                            <>
                                <div className={`flex items-center text-xs px-2.5 py-1.5 rounded-md border w-fit ${designer.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />
                                    {designer.isActive ? '已啟用 (接受預約)' : '暫停預約'}
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5em] leading-relaxed">
                                    {designer.bio || '無個人簡介'}
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                                尚未建立公開檔案
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => openModal(user, designer)}
                            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <PencilIcon className="h-4 w-4 mr-2 text-gray-500" />
                            {hasProfile ? '編輯檔案' : '建立檔案'}
                        </button>
                        {hasProfile && (
                            <button 
                                onClick={() => handleDeleteProfile(designer.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                title="刪除檔案"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            );
        })}
        
        {staffUsers.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed">
                目前沒有任何使用者擁有「設計師」或「管理設計師」身分。
                <br />
                請至「用戶管理」頁面進行設定。
            </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTarget?.designer ? '編輯設計師檔案' : '建立設計師檔案'}
      >
          <div className="space-y-5 px-1 py-2">
              <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 mb-4">
                  正在編輯 <strong>{editingTarget?.user.profile.displayName}</strong> 的公開檔案。
                  頭像將自動同步自使用者帳號。
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱 <span className="text-red-500">*</span></label>
                  <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow"
                      placeholder="例如：Anna"
                  />
                  <p className="mt-1 text-xs text-gray-500">預約頁面上顯示的名字</p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
                  <input 
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow"
                      placeholder="例如：店長、資深設計師"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">個人簡介</label>
                  <textarea 
                      value={formData.bio}
                      onChange={e => setFormData({...formData, bio: e.target.value})}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow resize-none"
                      placeholder="介紹您的專長與風格..."
                  />
              </div>

              <div className="flex items-center pt-2">
                  <input
                      id="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="h-4 w-4 text-[#9F9586] focus:ring-[#9F9586] border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                      開放預約 (啟用狀態)
                  </label>
              </div>

              <div className="mt-8 flex gap-3 justify-end pt-2 border-t border-gray-100">
                  <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
                  >
                      取消
                  </button>
                  <button
                      type="button"
                      onClick={handleSave}
                      className="px-6 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8a8175] transition-colors text-sm font-medium shadow-sm hover:shadow"
                  >
                      儲存
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default StaffManagementPage;