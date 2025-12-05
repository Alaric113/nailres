import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAllUsers } from "../hooks/useAllUsers";
import type {  UserRole } from '../types/user';
import UserCard from '../components/admin/UserCard'; // 引入新的元件
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// 預設頭像 URL
const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

const CustomerListPage = () => {
  const { users, loading, error } = useAllUsers();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  if (loading) {
    return <div className="p-4 text-center text-text-light">正在載入客戶資料...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">載入客戶資料時發生錯誤: {error.message}</div>;
  }

  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) {
      return false;
    }

    // Search term filter
    if (!searchTerm) {
      return true;
    }
    const term = searchTerm.toLowerCase();
    const displayName = user.profile.displayName?.toLowerCase() || '';
    const email = user.email.toLowerCase();
    return displayName.includes(term) || email.includes(term);
  });

  const handleEditClick = (userId: string, currentNote: string | undefined) => {
    setEditingUserId(userId);
    setNoteText(currentNote || '');
    setSaveError(null);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setNoteText('');
  };

  const handleSaveNote = async (userId: string, newNote: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { notes: newNote });
    } catch (err) {
      console.error("Error updating note:", err);
      setSaveError("儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };  

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdatingRole(true);
    setSaveError(null);

    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { role: newRole });
    } catch (err) {
      console.error("Error updating role:", err);
      setSaveError("權限更新失敗，請稍後再試。");
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const tabs: { key: UserRole | 'all'; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'admin', label: '管理員' },
    { key: 'platinum', label: '白金會員' },
    { key: 'user', label: '一般會員' },
  ];

  const getTabClass = (tabKey: UserRole | 'all') => {
    return roleFilter === tabKey
      ? 'bg-primary text-white shadow-md'
      : 'bg-white text-text-light hover:bg-secondary hover:text-text-main border border-secondary-dark/20';
  };


  return (
    <div className="min-h-screen bg-secondary-light text-text-main">
      <header className="bg-white/80 backdrop-blur-md border-b border-secondary-dark sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-text-main">
            客戶管理
          </h1>
          <Link to="/admin" className="flex items-center text-sm font-medium text-primary hover:text-primary-dark transition-colors">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            返回管理員頁面
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 space-y-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-text-light" />
            </div>
            <input
              type="text"
              placeholder="搜尋客戶名稱或 Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-secondary-dark/30 rounded-xl leading-5 bg-white placeholder-text-light/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${getTabClass(tab.key)}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
        </div>

        {saveError && <p className="mb-4 text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">{saveError}</p>}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-sm border border-secondary-dark rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-secondary-light">
              <thead className="bg-secondary">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">客戶名稱</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">角色</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-text-light uppercase tracking-wider font-serif">備註</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-light">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary-light/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-main">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover border border-secondary-dark/20" 
                            src={user.profile.avatarUrl || DEFAULT_AVATAR} 
                            alt="" 
                            crossOrigin="anonymous"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-text-main">{user.profile.displayName || 'N/A'}</div>
                          <div className="text-xs text-text-light">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={isUpdatingRole}
                        className={`w-full p-1.5 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors ${
                          user.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' : 
                          user.role === 'platinum' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <option value="admin">管理員</option>
                        <option value="user">一般會員</option>
                        <option value="platinum">白金會員</option>
                      </select>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-normal text-sm text-text-light min-w-[250px]">
                      {editingUserId === user.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea 
                            value={noteText} 
                            onChange={(e) => setNoteText(e.target.value)} 
                            className="w-full p-2 border border-secondary-dark/30 rounded-lg focus:ring-primary focus:border-primary outline-none" 
                            rows={3} 
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveNote(user.id, noteText)} disabled={isSaving} className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:bg-gray-300 transition-colors">{isSaving ? '儲存中...' : '儲存'}</button>
                            <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-medium text-text-main bg-secondary rounded-md hover:bg-secondary-dark transition-colors">取消</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 group">
                          <p className="flex-1 break-words text-text-main/80">{user.notes || <span className="text-text-light/40 italic">無備註</span>}</p>
                          <button onClick={() => handleEditClick(user.id, user.notes)} className="text-primary hover:text-primary-dark text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-medium">編輯</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              isUpdatingRole={isUpdatingRole}
              onRoleChange={handleRoleChange}
              onSaveNote={handleSaveNote}
              onSaveError={setSaveError}
            />
          ))}
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-text-light bg-white rounded-xl border border-dashed border-secondary-dark mt-6">
            <p className="text-lg font-serif">
              {roleFilter !== 'all' || searchTerm
                ? '找不到符合條件的客戶'
                : '目前沒有任何客戶資料'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerListPage;
