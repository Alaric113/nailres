import React, { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Feedback, FeedbackComment } from '../../types/feedback';
import { FEEDBACK_CATEGORIES } from '../../types/feedback';
import { useAuthStore } from '../../store/authStore';
import {
    TrashIcon,
    CheckCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    PaperAirplaneIcon,
    UserCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface FeedbackItemProps {
    feedback: Feedback;
    onToggleStatus: (id: string, currentStatus: 'pending' | 'done') => void;
    onDelete: (id: string) => void;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ feedback, onToggleStatus, onDelete }) => {
    const { userProfile } = useAuthStore();
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [comments, setComments] = useState<FeedbackComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    // Fetch comments real-time (always, to show count)
    useEffect(() => {
        // Removed !isCommentsOpen check to ensure count is always visible
        setLoadingComments(true);
        const q = query(
            collection(db, 'feedback', feedback.id, 'comments'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as FeedbackComment[];
            setComments(fetchedComments);
            setLoadingComments(false);
        });

        return () => unsubscribe();
    }, [feedback.id]);

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await addDoc(collection(db, 'feedback', feedback.id, 'comments'), {
                content: newComment,
                createdAt: serverTimestamp(),
                authorName: userProfile?.profile?.displayName || 'Admin',
                authorRole: userProfile?.role || 'staff'
            });
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('無法新增留言');
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp) return '';
        return format(timestamp.toDate(), 'MM/dd HH:mm');
    };

    return (
        <div className={`
            bg-white rounded-xl shadow-sm border transition-all duration-300
            ${feedback.status === 'done' ? 'border-green-100 bg-green-50/20' : 'border-gray-200 hover:border-primary/40 hover:shadow-md'}
        `}>
            {/* Main Content */}
            <div className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-start gap-4 flex-1 w-full sm:w-auto">
                    <button
                        onClick={() => onToggleStatus(feedback.id, feedback.status)}
                        className={`
                            flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-1 sm:mt-0
                            ${feedback.status === 'done'
                                ? 'bg-green-500 border-green-500 text-white scale-110'
                                : 'border-gray-300 hover:border-primary hover:scale-110'
                            }
                        `}
                    >
                        {feedback.status === 'done' && <CheckCircleIcon className="w-4 h-4" />}
                    </button>
                    <div className="flex flex-col gap-1 w-full">
                        <span className={`text-lg transition-all break-words break-all ${feedback.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {feedback.content}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                            {feedback.category && (
                                <span className={`
                                    inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                                    ${feedback.category === 'ui' ? 'bg-purple-100 text-purple-700' : ''}
                                    ${feedback.category === 'logic' ? 'bg-blue-100 text-blue-700' : ''}
                                    ${feedback.category === 'bug' ? 'bg-red-100 text-red-700' : ''}
                                    ${feedback.category === 'other' ? 'bg-gray-100 text-gray-600' : ''}
                                `}>
                                    {FEEDBACK_CATEGORIES[feedback.category]}
                                </span>
                            )}
                            {feedback.createdAt && (
                                <span className="text-xs text-gray-400 sm:hidden">
                                    {formatDate(feedback.createdAt)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end w-full sm:w-auto gap-2 sm:gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                    {feedback.createdAt && (
                        <span className="text-xs text-gray-400 hidden sm:block">
                            {formatDate(feedback.createdAt)}
                        </span>
                    )}

                    {/* Comment Toggle */}
                    <button
                        onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                            ${isCommentsOpen || comments.length > 0
                                ? 'bg-primary/10 text-primary'
                                : 'text-gray-400 hover:bg-gray-100'
                            }
                        `}
                    >
                        <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                        {comments.length > 0 && <span>{comments.length}</span>}
                    </button>

                    <button
                        onClick={() => onDelete(feedback.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="刪除"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Comments Section */}
            {isCommentsOpen && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-4 rounded-b-xl animate-fade-in">
                    {/* Comments List */}
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar px-1">
                        {loadingComments ? (
                            <div className="text-center text-xs text-gray-400 py-2">載入留言中...</div>
                        ) : comments.length === 0 ? (
                            <div className="text-center text-xs text-gray-400 py-2 italic"></div>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 text-sm group">
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                        <UserCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-bold text-gray-700 text-xs">{comment.authorName}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed break-words">{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Comment Form */}
                    <form onSubmit={handleAddComment} className="flex gap-2 relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="撰寫留言..."
                            className="flex-1 pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-white rounded-full hover:bg-primary-dark disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FeedbackItem;
