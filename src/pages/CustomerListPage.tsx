import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAllUsers } from "../hooks/useAllUsers";
import { formatTimestamp } from "../utils/formatTimestamp";
import type { EnrichedUser } from '../types/user';

const CustomerListPage = () => {
  const { users, loading, error } = useAllUsers();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<EnrichedUser | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  if (loading) {
    return <div className="p-4">正在載入客戶資料...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">載入客戶資料時發生錯誤: {error.message}</div>;
  }

  const handleEditClick = (userId: string, currentNote: string | undefined) => {
    setEditingUserId(userId);
    setNoteText(currentNote || '');
    setSaveError(null);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setNoteText('');
  };

  const handleSaveNote = async (userId: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { notes: noteText });
      handleCancel(); // Exit editing mode on success
    } catch (err) {
      console.error("Error updating note:", err);
      setSaveError("儲存失敗，請稍後再試。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;

    setIsUpdatingRole(true);
    setSaveError(null);
    const newRole = roleChangeTarget.role === 'user' ? 'admin' : 'user';

    try {
      const userDocRef = doc(db, 'users', roleChangeTarget.id);
      await updateDoc(userDocRef, { role: newRole });
      setRoleChangeTarget(null); // Close modal on success
    } catch (err) {
      console.error("Error updating role:", err);
      setSaveError("權限更新失敗，請稍後再試。");
    } finally {
      setIsUpdatingRole(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            客戶管理
          </h1>
          <Link to="/admin" className="text-sm font-medium text-indigo-600 hover:underline">
            &larr; 返回管理員儀表板
          </Link>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {saveError && <p className="mb-4 text-red-500 bg-red-100 p-3 rounded-md">{saveError}</p>}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客戶名稱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  註冊時間
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  上次登入
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  備註
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.profile.displayName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.role === 'admin' ? '管理員' : '使用者'}
                      </span>
                      <button onClick={() => setRoleChangeTarget(user)} className="text-xs text-blue-600 hover:underline">
                        變更
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 min-w-[250px]">
                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveNote(user.id)} disabled={isSaving} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                            {isSaving ? '儲存中...' : '儲存'}
                          </button>
                          <button onClick={handleCancel} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            取消
                          </button>
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
          {users.length === 0 && !loading && (
            <p className="text-center py-8 text-gray-500">目前沒有任何客戶資料。</p>
          )}
        </div>
      </main>
      {/* Role Change Confirmation Modal */}
      {roleChangeTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full transform transition-all">
            <h3 className="text-lg font-bold mb-4">確認變更權限</h3>
            <p className="mb-6 text-sm text-gray-700">
              您確定要將使用者 <strong className="text-gray-900">{roleChangeTarget.profile.displayName || roleChangeTarget.email}</strong> 的權限變更為
              <strong className={`mx-1 ${roleChangeTarget.role === 'user' ? 'text-red-600' : 'text-green-600'}`}>
                {roleChangeTarget.role === 'user' ? '「管理員」' : '「使用者」'}
              </strong>
              嗎？
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setRoleChangeTarget(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                取消
              </button>
              <button onClick={handleConfirmRoleChange} disabled={isUpdatingRole} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors">
                {isUpdatingRole ? '更新中...' : '確認變更'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerListPage;