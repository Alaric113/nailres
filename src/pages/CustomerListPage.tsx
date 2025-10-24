import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAllUsers } from "../hooks/useAllUsers";
import { formatTimestamp } from "../utils/formatTimestamp";
import type {  UserRole } from '../types/user';
import UserCard from '../components/admin/UserCard'; // 引入新的元件

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
    return <div className="p-4">正在載入客戶資料...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">載入客戶資料時發生錯誤: {error.message}</div>;
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
      ? 'bg-pink-500 text-white'
      : 'bg-white text-gray-600 hover:bg-gray-100';
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            客戶管理
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員頁面
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="搜尋客戶名稱或 Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key)}
                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition-colors ${getTabClass(tab.key)}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
        </div>

        {saveError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded-md">{saveError}</p>}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">客戶名稱</th>
                  
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">註冊時間</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">上次登入</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">備註</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full object-cover" src={user.profile.avatarUrl || DEFAULT_AVATAR} alt="" />
                        </div>
                        <div className="ml-4">{user.profile.displayName || 'N/A'}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={isUpdatingRole}
                        className={`w-full p-1 border rounded-md text-xs ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' : 
                          user.role === 'platinum' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        <option value="admin">管理員</option>
                        <option value="user">一般會員</option>
                        <option value="platinum">白金會員</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(user.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatTimestamp(user.lastLogin)}</td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 min-w-[250px]">
                      {editingUserId === user.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" rows={3} />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveNote(user.id, noteText)} disabled={isSaving} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">{isSaving ? '儲存中...' : '儲存'}</button>
                            <button onClick={handleCancel} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">取消</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="flex-1 break-words">{user.notes || '無'}</p>
                          <button onClick={() => handleEditClick(user.id, user.notes)} className="text-indigo-600 hover:text-indigo-900 text-xs flex-shrink-0">編輯</button>
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
          <p className="text-center py-8 text-gray-500">
            {roleFilter !== 'all' || searchTerm
              ? '找不到符合條件的客戶。'
              : '目前沒有任何客戶資料。'}
          </p>
        )}
      </main>
    </div>
  );
};

export default CustomerListPage;
