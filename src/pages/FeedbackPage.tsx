import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Feedback } from '../types/feedback';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackItem from '../components/admin/FeedbackItem';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedFeedbacks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Feedback[];
      setFeedbacks(fetchedFeedbacks);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      showToast('載入問題回報失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;

    try {
      await addDoc(collection(db, 'feedback'), {
        content: newFeedback,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      setNewFeedback('');
      showToast('已新增問題回報', 'success');
      fetchFeedbacks();
    } catch (error) {
      console.error('Error adding feedback:', error);
      showToast('新增失敗', 'error');
    }
  };

  const toggleStatus = async (id: string, currentStatus: 'pending' | 'done') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
      await updateDoc(doc(db, 'feedback', id), {
        status: newStatus
      });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (error) {
       console.error('Error updating status:', error);
       showToast('更新狀態失敗', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('確定要刪除此項目嗎？')) return;
    try {
      await deleteDoc(doc(db, 'feedback', id));
      setFeedbacks(prev => prev.filter(f => f.id !== id));
      showToast('已刪除', 'success');
    } catch (error) {
      console.error('Error deleting feedback:', error);
      showToast('刪除失敗', 'error');
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl overflow-x-hidden w-full">
      <div className="mb-8">
          <h1 className="text-2xl font-bold font-serif text-gray-800">問題回報與待辦事項</h1>
          <p className="text-sm text-gray-500 mt-1">追蹤待辦事項並與團隊成員討論解決方案。</p>
      </div>
      
      {/* Add New Feedback */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 w-full">
        <form onSubmit={handleAddFeedback} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="輸入新的問題或待辦事項..."
            className="flex-1 px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-full"
          />
          <button
            type="submit"
            disabled={!newFeedback.trim()}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm w-full sm:w-auto"
          >
            新增事項
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4 w-full">
          {feedbacks.length === 0 ? (
             <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
               <p>目前沒有任何待辦事項</p>
               <p className="text-xs mt-2">享受清空的一天！</p>
             </div>
          ) : (
            // Sorting Logic: Pending first, then Done. Within status, sort by date (desc) usually, but user asked for "Done at bottom".
            // Adding a secondary sort might be nice, but primary is Status.
             [...feedbacks]
             .sort((a, b) => {
                // 1. Status Check: Pending (0) < Done (1)
                const statusA = a.status === 'pending' ? 0 : 1;
                const statusB = b.status === 'pending' ? 0 : 1;
                if (statusA !== statusB) return statusA - statusB;

                // 2. Date Check: Newest first
                const dateA = a.createdAt?.toMillis() || 0;
                const dateB = b.createdAt?.toMillis() || 0;
                return dateB - dateA;
             })
             .map(feedback => (
                <FeedbackItem 
                    key={feedback.id} 
                    feedback={feedback} 
                    onToggleStatus={toggleStatus} 
                    onDelete={handleDelete} 
                />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
