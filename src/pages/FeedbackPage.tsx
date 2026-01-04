import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Feedback, FeedbackCategory } from '../types/feedback';
import { FEEDBACK_CATEGORIES } from '../types/feedback';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import FeedbackItem from '../components/admin/FeedbackItem';
import { useAuthStore } from '../store/authStore';
import {
  Squares2X2Icon,
  PaintBrushIcon,
  CpuChipIcon,
  BoltIcon,
  EllipsisHorizontalCircleIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type TabFilter = 'all' | FeedbackCategory;

const TAB_CONFIG: { key: TabFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Squares2X2Icon className="w-4 h-4" /> },
  { key: 'ui', label: 'UI/介面', icon: <PaintBrushIcon className="w-4 h-4" /> },
  { key: 'logic', label: '功能/邏輯', icon: <CpuChipIcon className="w-4 h-4" /> },
  { key: 'bug', label: 'Bug', icon: <BoltIcon className="w-4 h-4" /> },
  { key: 'other', label: '其他', icon: <EllipsisHorizontalCircleIcon className="w-4 h-4" /> },
];

const FeedbackPage = () => {
  const { userProfile } = useAuthStore();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState('');
  const [newCategory, setNewCategory] = useState<FeedbackCategory>('other');
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        category: newCategory,
        createdAt: serverTimestamp(),
        who: userProfile?.profile?.displayName || 'admin',
      });
      setNewFeedback('');
      setNewCategory('other');
      setIsModalOpen(false);
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

  // Filter feedbacks based on active tab
  const filteredFeedbacks = feedbacks.filter(f =>
    activeTab === 'all' || f.category === activeTab || (!f.category && activeTab === 'other')
  );

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl overflow-x-hidden w-full pb-24">


      {/* Category Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex justify-between sm:justify-start overflow-x-auto custom-scrollbar">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
                className={`
                  flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none px-2 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2
                  ${isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >

                <span className="">{tab.label}</span>

              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4 w-full">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p>此分類目前沒有任何項目</p>
              <p className="text-xs mt-2">
                {activeTab === 'all' ? '享受清空的一天！' : '試著新增一個吧！'}
              </p>
            </div>
          ) : (
            [...filteredFeedbacks]
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

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-40"
        aria-label="新增事項"
      >
        <PlusIcon className="w-7 h-7" />
      </button>

      {/* Add Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pb-16 sm:pb-0">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 animate-slide-up sm:animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">新增事項</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddFeedback} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="輸入新的問題或待辦事項..."
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Category Selector */}
              <div>
                <p className="text-sm text-gray-500 mb-2">分類</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(FEEDBACK_CATEGORIES) as FeedbackCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${newCategory === cat
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {FEEDBACK_CATEGORIES[cat]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!newFeedback.trim()}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                新增事項
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
