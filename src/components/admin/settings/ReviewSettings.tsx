import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useGlobalSettings } from '../../../hooks/useGlobalSettings';
import { useToast } from '../../../context/ToastContext';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../common/LoadingSpinner';

interface Review {
  id: string;
  userName: string;
  customerFeedback: {
    rating: number;
    comment: string;
    submittedAt?: any;
    tags?: string[];
  };
  isReviewHidden?: boolean;
  dateTime: any;
  serviceNames?: string[];
}

const ReviewSettings: React.FC = () => {
  const { settings, updateGlobalSettings } = useGlobalSettings();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Local state for settings form
  const [showReviews, setShowReviews] = useState(true);
  const [minRating, setMinRating] = useState(4);

  useEffect(() => {
    if (settings.reviewSettings) {
      setShowReviews(settings.reviewSettings.showReviews);
      setMinRating(settings.reviewSettings.minRating);
    }
  }, [settings.reviewSettings]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const q = query(
          collection(db, 'public_reviews'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedReviews: Review[] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          fetchedReviews.push({
            id: doc.id,
            userName: data.userName || (data.isAnonymous ? '匿名客戶' : '未知用戶'),
            customerFeedback: {
              rating: data.rating,
              comment: data.comment,
              submittedAt: data.createdAt
            },
            isReviewHidden: data.isReviewHidden,
            dateTime: data.createdAt,
            serviceNames: data.serviceNames
          } as Review);
        });

        setReviews(fetchedReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await updateGlobalSettings({
        reviewSettings: {
          showReviews,
          minRating
        }
      });
      showToast('設定已儲存', 'success');
    } catch (error) {
      showToast('儲存失敗', 'error');
    }
  };

  const toggleReviewVisibility = async (reviewId: string, currentHidden: boolean) => {
    try {
      const reviewRef = doc(db, 'public_reviews', reviewId);
      await updateDoc(reviewRef, {
        isReviewHidden: !currentHidden
      });
      
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, isReviewHidden: !currentHidden } : r
      ));
      
      showToast(currentHidden ? '評論已顯示' : '評論已隱藏', 'success');
    } catch (error) {
      console.error("Error toggling review:", error);
      showToast('更新失敗', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* 1. Global Display Settings */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#EFECE5]">
        <h3 className="text-lg font-bold text-gray-900 mb-4">評論顯示設定</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
             <input
               type="checkbox"
               id="showReviewsHelper"
               checked={showReviews}
               onChange={(e) => setShowReviews(e.target.checked)}
               className="w-5 h-5 text-[#9F9586] rounded border-gray-300 focus:ring-[#9F9586]"
             />
             <label htmlFor="showReviewsHelper" className="text-sm font-medium text-gray-700">
               在首頁顯示客戶評論區塊
             </label>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">最低顯示星等</label>
             <select
               value={minRating}
               onChange={(e) => setMinRating(Number(e.target.value))}
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#9F9586] focus:ring-[#9F9586] sm:text-sm"
             >
               <option value={5}>5 星</option>
               <option value={4}>4 星以上</option>
               <option value={3}>3 星以上</option>
               <option value={1}>顯示所有</option>
             </select>
             <p className="mt-1 text-xs text-gray-500">只有達到此星等的評論才會顯示在首頁。</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-[#9F9586] text-white rounded-lg hover:bg-[#8a8174] transition-colors text-sm font-bold"
          >
            儲存設定
          </button>
        </div>
      </section>

      {/* 2. Review Management List */}
      <section className="bg-white rounded-2xl shadow-sm border border-[#EFECE5] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">所有評論 ({reviews.length})</h3>
        </div>
        
        <div className="divide-y divide-gray-100">
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">暫無評論</div>
          ) : (
            reviews.map(review => (
              <div key={review.id} className={`p-6 flex flex-col sm:flex-row gap-4 ${review.isReviewHidden ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
                {/* Review Content */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-900">{review.userName}</span>
                        <span className="text-xs text-gray-400">• {(review.dateTime?.toDate ? review.dateTime.toDate() : new Date(review.dateTime)).toLocaleDateString()}</span>
                        {review.isReviewHidden && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">已隱藏</span>}
                    </div>
                    
                    <div className="flex text-yellow-400 w-24">
                        {[...Array(5)].map((_, i) => (
                            <StarIconSolid key={i} className={`w-4 h-4 ${i < review.customerFeedback.rating ? '' : 'text-gray-200'}`} />
                        ))}
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed">
                        {review.customerFeedback.comment || "（無文字評論）"}
                    </p>
                    
                    {review.serviceNames && (
                        <div className="text-xs text-gray-400 mt-2">
                            體驗項目: {Array.isArray(review.serviceNames) ? review.serviceNames.join(', ') : review.serviceNames}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-start justify-end sm:w-32 pt-2 sm:pt-0">
                    <button
                        onClick={() => toggleReviewVisibility(review.id, !!review.isReviewHidden)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            review.isReviewHidden 
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {review.isReviewHidden ? (
                            <>
                                <EyeIcon className="w-3.5 h-3.5" />
                                顯示
                            </>
                        ) : (
                            <>
                                <EyeSlashIcon className="w-3.5 h-3.5" />
                                隱藏
                            </>
                        )}
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default ReviewSettings;
