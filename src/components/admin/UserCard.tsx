import React, { useState } from 'react';
import type { EnrichedUser, UserRole } from '../../types/user';
import { TrashIcon } from '@heroicons/react/24/outline';
import { motion, useAnimation, type PanInfo } from 'framer-motion';

interface UserCardProps {
  user: EnrichedUser;
  isUpdatingRole: boolean;
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onSaveNote: (userId: string, note: string) => Promise<void>;
  onSaveError: (error: string | null) => void;
  onDeleteClick: () => void;
}

const roleMap: Record<UserRole, string> = {
  admin: '管理員',
  manager: '管理設計師',
  designer: '設計師',
  platinum: '白金會員',
  user: '一般會員',
};

const DEFAULT_AVATAR = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

const UserCard: React.FC<UserCardProps> = ({ user, isUpdatingRole, onRoleChange, onSaveNote, onSaveError, onDeleteClick }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(user.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const controls = useAnimation();

  const handleEditClick = () => {
    setIsEditing(true);
    setNoteText(user.notes || '');
    onSaveError(null);
    controls.start({ x: 0 }); // Ensure it closes if trying to edit
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

  const handleDragEnd = (_: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Threshold to snap open (reveal delete)
    // If dragged left significantly or flicked left
    if (offset < -60 || velocity < -500) {
      controls.start({ x: -80 }); 
    } else {
      controls.start({ x: 0 });
    }
  };

  return (
    <div className="relative rounded-xl shadow-md bg-red-500 overflow-hidden">
        {/* Background Layer (Delete Action) */}
        <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center">
            <button 
                onClick={onDeleteClick}
                className="w-full h-full flex flex-col items-center justify-center text-white active:bg-red-600 transition-colors"
            >
                <TrashIcon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold ">刪除</span>
            </button>
        </div>

        {/* Foreground Layer (Card Content) */}
        <motion.div
            drag={!isEditing && !isUpdatingRole ? "x" : false}
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.1}
            animate={controls}
            onDragEnd={handleDragEnd}
            className="relative bg-white border border-gray-200 rounded-lg flex overflow-hidden z-10"
            style={{ x: 0 }} // Initial state
        >
            {/* Left: Avatar */}
            <div className="flex-shrink-0 w-24 p-2 justify-center items-center flex bg-gray-50">
                <img className="w-20 h-20 rounded-full object-cover" src={user.profile.avatarUrl || DEFAULT_AVATAR} alt="Avatar" />
            </div>
            {/* Right: Content */}
            <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 truncate pr-2">{user.profile.displayName || 'N/A'}</h3>
                    <select
                      value={user.role}
                      onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
                      disabled={isUpdatingRole}
                      className={`p-1 border rounded-md text-xs flex-shrink-0 ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' : 
                        user.role === 'manager' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                        user.role === 'platinum' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 
                        user.role === 'designer' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}
                      // Prevent drag propagation on select interaction
                      onPointerDownCapture={(e) => e.stopPropagation()}
                    >
                      <option value="admin">{roleMap.admin}</option>
                      <option value="manager">{roleMap.manager}</option>
                      <option value="designer">{roleMap.designer}</option>
                      <option value="platinum">{roleMap.platinum}</option>
                      <option value="user">{roleMap.user}</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <strong className="text-sm font-medium text-gray-600">備註:</strong>
                  {isEditing ? (
                    <div className="flex flex-col gap-2 mt-1">
                      <textarea 
                        value={noteText} 
                        onChange={(e) => setNoteText(e.target.value)} 
                        className="w-full p-2 border border-gray-300 rounded-md text-sm" 
                        rows={2}
                        onPointerDownCapture={(e) => e.stopPropagation()} // Allow text selection
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSave} disabled={isSaving} className="px-3 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-gray-400">{isSaving ? '儲存中...' : '儲存'}</button>
                        <button onClick={handleCancel} className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 mt-1">
                      <p className="flex-1 break-words text-sm text-gray-500">{user.notes || '無'}</p>
                      <button onClick={handleEditClick} className="text-indigo-600 hover:text-indigo-900 text-xs flex-shrink-0 font-medium">編輯</button>
                    </div>
                  )}
                </div>
                
            </div>
        </motion.div>
    </div>
  );
};

export default UserCard;
