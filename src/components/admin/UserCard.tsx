import React, { useState } from 'react';
import type { EnrichedUser, UserRole } from '../../types/user';

interface UserCardProps {
  user: EnrichedUser;
  isUpdatingRole: boolean; // Restore prop
  onRoleChange: (userId: string, newRole: UserRole) => void; // Restore prop
  onSaveNote: (userId: string, note: string) => Promise<void>;
  onSaveError: (error: string | null) => void;
}

const roleMap: Record<UserRole, string> = {
  admin: '管理員',
  manager: '管理設計師',
  designer: '設計師',
  platinum: '白金會員',
  user: '一般會員',
};

const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

const UserCard: React.FC<UserCardProps> = ({ user, isUpdatingRole, onRoleChange, onSaveNote, onSaveError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(user.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
    setNoteText(user.notes || '');
    onSaveError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNoteText(user.notes || '');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveNote(user.id, noteText);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 border border-red-200 shrink-0">管理員</span>;
      case 'manager':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 shrink-0">管理設計師</span>;
      case 'designer':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200 shrink-0">設計師</span>;
      case 'platinum':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 shrink-0">白金會員</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 flex overflow-hidden">
      {/* Left: Avatar */}
      <div className="flex-shrink-0 w-24 p-2 justify-center items-center flex bg-gray-50">
        <img className="w-20 h-20 rounded-full object-cover" src={user.profile.avatarUrl || DEFAULT_AVATAR} alt="Avatar" />
      </div>
      {/* Right: Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-800 truncate pr-2 flex flex-wrap items-center gap-1">
              {user.profile.displayName || 'N/A'}
              {getRoleBadge(user.role)}
            </h3>
          </div>
          {/* Mobile Dropdown */}
          <select
              value={user.role}
              onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
              disabled={isUpdatingRole}
              className="mt-1 block w-full p-1 border border-gray-300 rounded-md text-xs focus:ring-primary focus:border-primary"
            >
              <option value="admin">{roleMap.admin}</option>
              <option value="manager">{roleMap.manager}</option>
              <option value="designer">{roleMap.designer}</option>
              <option value="platinum">{roleMap.platinum}</option>
              <option value="user">{roleMap.user}</option>
            </select>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <strong className="text-sm font-medium text-gray-600">備註:</strong>
          {isEditing ? (
            <div className="flex flex-col gap-2 mt-1">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" rows={2} />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">{isSaving ? '儲存中...' : '儲存'}</button>
                <button onClick={handleCancel} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">取消</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2 mt-1">
              <p className="flex-1 break-words text-sm text-gray-500">{user.notes || '無'}</p>
              <button onClick={handleEditClick} className="text-indigo-600 hover:text-indigo-900 text-xs flex-shrink-0">編輯</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserCard;