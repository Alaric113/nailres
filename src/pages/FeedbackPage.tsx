import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Feedback } from '../types/feedback';
import { useToast } from '../context/ToastContext';
import { TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Adjust icons
import LoadingSpinner from '../components/common/LoadingSpinner';

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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl overflow-x-hidden w-full">
      <h1 className="text-2xl font-bold font-serif mb-6 text-gray-800">問題回報與待辦事項</h1>
      
      {/* Add New Feedback */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 w-full">
        <form onSubmit={handleAddFeedback} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="輸入新的問題或待辦事項..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-full"
          />
          <button
            type="submit"
            disabled={!newFeedback.trim()}
            className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm w-full sm:w-auto"
          >
            新增
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4 w-full">
          {feedbacks.length === 0 ? (
             <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               目前沒有任何待辦事項。
             </div>
          ) : (
            feedbacks.map(feedback => (
              <div
                key={feedback.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg shadow-sm border transition-all gap-4 ${
                  feedback.status === 'done' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 w-full sm:w-auto">
                  <button
                    onClick={() => toggleStatus(feedback.id, feedback.status)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-1 sm:mt-0 ${
                      feedback.status === 'done'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {feedback.status === 'done' && <CheckCircleIcon className="w-4 h-4" />}
                  </button>
                  <span className={`text-lg transition-all break-words break-all ${feedback.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {feedback.content}
                  </span>
                </div>
                
                <div className="flex items-center justify-end w-full sm:w-auto gap-4 sm:ml-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100">
                  {feedback.createdAt && (
                     <span className="text-xs text-gray-400">
                       {feedback.createdAt.toDate().toLocaleDateString()}
                     </span>
                  )}
                  <button
                    onClick={() => handleDelete(feedback.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="刪除"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
