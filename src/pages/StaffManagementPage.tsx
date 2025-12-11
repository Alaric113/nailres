import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import type { Designer } from '../types/designer';
import type { EnrichedUser } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserCircleIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const StaffManagementPage: React.FC = () => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Partial<Designer>>({});
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Designers
        const designersRef = collection(db, 'designers');
        const designersSnapshot = await getDocs(designersRef);
        const loadedDesigners = designersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Designer));
        setDesigners(loadedDesigners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));

        // Fetch Potential Users to link (Admins or Designers)
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('role', 'in', ['admin', 'designer']));
        const usersSnapshot = await getDocs(q);
        const loadedUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrichedUser));
        setUsers(loadedUsers);

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!editingDesigner.name) return;

    const id = editingDesigner.id || uuidv4();
    const newDesigner: Designer = {
      id,
      name: editingDesigner.name!,
      title: editingDesigner.title || '',
      bio: editingDesigner.bio || '',
      linkedUserId: editingDesigner.linkedUserId || null,
      isActive: editingDesigner.isActive ?? true,
      displayOrder: editingDesigner.displayOrder || designers.length + 1,
    };

    try {
      await setDoc(doc(db, 'designers', id), newDesigner);
      
      setDesigners(prev => {
        const others = prev.filter(d => d.id !== id);
        return [...others, newDesigner].sort((a, b) => a.displayOrder - b.displayOrder);
      });
      setIsModalOpen(false);
      setEditingDesigner({});
    } catch (error) {
      console.error("Error saving designer:", error);
      alert("儲存失敗");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除這位設計師嗎？")) return;
    try {
      await deleteDoc(doc(db, 'designers', id));
      setDesigners(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error("Error deleting designer:", error);
    }
  };

  const openModal = (designer?: Designer) => {
    setEditingDesigner(designer || { isActive: true });
    setIsModalOpen(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">設計師與員工管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理店內設計師資料、連結系統帳號與設定營業時間</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#9F9586] hover:bg-[#8a8175] transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新增設計師
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designers.map(designer => {
            const linkedUser = users.find(u => u.id === designer.linkedUserId);
            return (
                <div key={designer.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col transition-all hover:shadow-md ${designer.isActive ? 'border-[#EFECE5]' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-secondary-light flex items-center justify-center text-[#9F9586] text-xl font-bold border border-[#EFECE5] overflow-hidden">
                                {designer.avatarUrl ? (
                                    <img src={designer.avatarUrl} alt={designer.name} className="h-full w-full object-cover" />
                                ) : (
                                    designer.name[0]
                                )}
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-bold text-gray-900">{designer.name}</h3>
                                <p className="text-sm text-gray-500">{designer.title || '設計師'}</p>
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${designer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                            {designer.isActive ? '接受預約' : '暫停服務'}
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        {designer.linkedUserId ? (
                            <div className="flex items-center text-xs text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                                <CheckBadgeIcon className="h-3.5 w-3.5 mr-1.5" />
                                已連結: {linkedUser?.profile.displayName || '使用者'}
                            </div>
                        ) : (
                            <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-md border border-dashed border-gray-300">
                                <UserCircleIcon className="h-3.5 w-3.5 mr-1.5" />
                                未連結系統帳號
                            </div>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5em] leading-relaxed">
                            {designer.bio || '無個人簡介'}
                        </p>
                    </div>

                    <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                        <button 
                            onClick={() => openModal(designer)}
                            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <PencilIcon className="h-4 w-4 mr-2 text-gray-500" />
                            編輯資料
                        </button>
                        <button 
                            onClick={() => handleDelete(designer.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDesigner.id ? '編輯設計師' : '新增設計師'}
      >
          <div className="space-y-5 px-1 py-2">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">顯示名稱</label>
                  <input 
                      type="text" 
                      value={editingDesigner.name || ''}
                      onChange={e => setEditingDesigner({...editingDesigner, name: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow"
                      placeholder="例如：Anna"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
                  <input 
                      type="text" 
                      value={editingDesigner.title || ''}
                      onChange={e => setEditingDesigner({...editingDesigner, title: e.target.value})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow"
                      placeholder="例如：店長、資深設計師"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                      連結系統帳號 <span className="text-gray-400 font-normal text-xs">(用於接收通知與登入判定)</span>
                  </label>
                  <select
                      value={editingDesigner.linkedUserId || ''}
                      onChange={e => setEditingDesigner({...editingDesigner, linkedUserId: e.target.value || null})}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm bg-white transition-shadow"
                  >
                      <option value="">-- 無連結 --</option>
                      {users.map(u => (
                          <option key={u.id} value={u.id}>
                              {u.profile.displayName} ({u.role === 'admin' ? '管理員' : '設計師'})
                          </option>
                      ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500">
                      連結後，該帳號將會收到此設計師的預約通知。
                  </p>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">個人簡介</label>
                  <textarea 
                      value={editingDesigner.bio || ''}
                      onChange={e => setEditingDesigner({...editingDesigner, bio: e.target.value})}
                      rows={3}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#9F9586]/50 focus:border-[#9F9586] sm:text-sm transition-shadow resize-none"
                  />
              </div>

              <div className="flex items-center pt-2">
                  <input
                      id="isActive"
                      type="checkbox"
                      checked={editingDesigner.isActive ?? true}
                      onChange={e => setEditingDesigner({...editingDesigner, isActive: e.target.checked})}
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