import React, { useState } from 'react';
import type { EnrichedUser } from '../../types/user';

interface UserCardProps {
  user: EnrichedUser;
  onSaveNote: (userId: string, note: string) => Promise<void>;
  onSaveError: (error: string | null) => void;
}

const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

const UserCard: React.FC<UserCardProps> = ({ user, onSaveNote, onSaveError }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(user.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleEditClick = () => { // No arguments here
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
            <h3 className="font-bold text-lg text-gray-800 truncate pr-2 flex items-center gap-2">
              {user.profile.displayName || 'N/A'}
              {user.role === 'designer' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                  設計師
                </span>
              )}
            </h3>
          </div>
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
