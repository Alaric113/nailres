import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { BookingDocument } from '../types/booking';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { ChevronLeftIcon, PhotoIcon, TrashIcon, StarIcon, SparklesIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

// Simple Image Uploader for this page
const FeedbackImageUploader = ({ onUpload, onDelete, existingImages }: { 
    onUpload: (url: string) => void, 
    onDelete: (index: number) => void,
    existingImages: string[] 
}) => {
    const [uploading, setUploading] = useState(false);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const imageRef = ref(storage, `feedback_photos/${uuidv4()}`);
        try {
            const snapshot = await uploadBytes(imageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            onUpload(url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("上傳失敗");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-4 overflow-x-auto pb-2">
                {existingImages.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 flex-shrink-0 group">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                        <button 
                            type="button"
                            onClick={() => onDelete(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                
                <label className={`
                    w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                    ${uploading ? 'opacity-50 pointer-events-none' : ''}
                `}>
                    {uploading ? (
                         <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <PhotoIcon className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500 font-medium">新增照片</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
                </label>
            </div>
        </div>
    );
};

interface BookingDetail extends BookingDocument {
    id: string;
    designerName?: string;
    designerPhotoUrl?: string | null;
}

const OrderFeedbackPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { currentUser } = useAuthStore();
    
    const [booking, setBooking] = useState<BookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Feedback State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isAnonymous, setIsAnonymous] = useState(false); // New State

    useEffect(() => {
        if (!orderId) return;

        const fetchData = async () => {
            try {
                const docRef = doc(db, 'bookings', orderId);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    const data = docSnap.data() as BookingDocument;
                    
                    // Verify ownership
                    if (currentUser && data.userId !== currentUser.uid) {
                        showToast('無權限訪問此訂單', 'error');
                        navigate('/member/history');
                        return;
                    }

                    // Fetch Designer Info
                    let designerName = '未指定';
                    let designerPhotoUrl = null;
                    if (data.designerId) {
                        const dRef = doc(db, 'designers', data.designerId);
                        const dSnap = await getDoc(dRef);
                        if (dSnap.exists()) {
                            designerName = dSnap.data()?.name;
                            designerPhotoUrl = dSnap.data()?.avatarUrl;
                        }
                    }

                    setBooking({ id: docSnap.id, ...data, designerName, designerPhotoUrl });

                    // Pre-fill if exists
                    if (data.customerFeedback) {
                        setRating(data.customerFeedback.rating || 5);
                        setComment(data.customerFeedback.comment || '');
                        setPhotos(data.customerFeedback.photos || []);
                        setIsAnonymous(data.customerFeedback.isAnonymous || false);
                    }
                } else {
                    showToast('找不到訂單', 'error');
                    navigate('/member/history');
                }
            } catch (err) {
                console.error(err);
                showToast('載入失敗', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderId, currentUser]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;

        setSubmitting(true);
        try {
            const { useAuthStore } = await import('../store/authStore'); // Dynamic import to ensure latest state if needed, or just rely on hook
            const storeState = useAuthStore.getState();
            const userProfile = storeState.userProfile;

            // 1. Update Booking (Private)
            await updateDoc(doc(db, 'bookings', booking.id), {
                customerFeedback: {
                    rating,
                    comment,
                    photos,
                    isAnonymous,
                    createdAt: serverTimestamp()
                }
            });

            // 2. Create/Update Public Review (Public)
            // We use setDoc with booking.id to keep them linked 1:1
            const { setDoc } = await import('firebase/firestore'); 
            
            const reviewData: any = {
                bookingId: booking.id,
                userId: currentUser!.uid, 
                rating,
                comment,
                photos,
                designerName: booking.designerName,
                serviceNames: booking.serviceNames, // Array of strings
                createdAt: serverTimestamp(),
                isAnonymous
            };

            // If NOT anonymous, attach user info
            if (!isAnonymous && userProfile) {
                reviewData.userName = userProfile.profile?.displayName || '客戶';
                reviewData.userAvatarUrl = userProfile.profile?.avatarUrl || null;
            }

            await setDoc(doc(db, 'public_reviews', booking.id), reviewData);

            showToast('评价已送出，謝謝您的回饋！', 'success');
            navigate('/member/history');
        } catch (err) {
            console.error('Error submitting feedback:', err);
            showToast('送出失败，请稍后在试', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;
    if (!booking) return null;

    return (
        <div className="min-h-screen bg-[#FAF9F6] pb-24">
            {/* Header */}
            <header className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100/50 shadow-sm flex items-center">
                 <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-gray-50 rounded-full transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
                 </button>
                 <h1 className="text-xl font-bold text-gray-800">訂單評價</h1>
            </header>

            <div className="container mx-auto px-4 max-w-lg mt-6 space-y-6">
                
                {/* Order Summary Card */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-3">
                             {/* Designer Avatar */}
                             <div className="flex-shrink-0">
                                {booking.designerPhotoUrl ? (
                                    <img src={booking.designerPhotoUrl} alt={booking.designerName} className="w-12 h-12 rounded-full object-cover border border-gray-100" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                        <SparklesIcon className="w-6 h-6" />
                                    </div>
                                )}
                             </div>
                             <div>
                                <p className="text-sm text-gray-500 font-medium mb-0.5">本次服務設計師</p>
                                <p className="text-lg font-bold text-gray-900">{booking.designerName}</p>
                             </div>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-gray-400 mb-1 flex items-center justify-end gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {format((booking.dateTime as Timestamp).toDate(), 'yyyy/MM/dd')}
                             </p>
                             <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                {booking.status === 'completed' ? '已完成' : '已確認'}
                             </span>
                        </div>
                    </div>

                    <div className="border-t border-gray-50 my-3"></div>

                    {/* Services List */}
                    <div className="space-y-2">
                        {(booking.items && booking.items.length > 0) ? (
                            booking.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 font-medium">{item.serviceName}</span>
                                    {/* Optional: Show options summary if needed, keeping it simple for now */}
                                </div>
                            ))
                        ) : (
                            booking.serviceNames.map((name, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700 font-medium">{name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Feedback Form */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    
                    {/* Rating Star */}
                    <div className="text-center">
                        <label className="block text-sm font-bold text-gray-500 mb-3">整體滿意度</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform active:scale-95 hover:scale-110"
                                >
                                    {star <= rating ? (
                                        <StarIconSolid className="w-10 h-10 text-yellow-400" />
                                    ) : (
                                        <StarIcon className="w-10 h-10 text-gray-200" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-400 mt-2 font-medium">
                            {rating === 5 ? '非常滿意' : rating === 4 ? '滿意' : rating === 3 ? '普通' : '不滿意'}
                        </p>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">留下您的評論</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="設計師技術如何？環境舒適嗎？歡迎分享您的心得..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32 text-gray-700 placeholder-gray-400"
                        />
                    </div>

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">上傳照片 (選填)</label>
                        <FeedbackImageUploader 
                            existingImages={photos}
                            onUpload={(url) => setPhotos([...photos, url])}
                            onDelete={(idx) => setPhotos(photos.filter((_, i) => i !== idx))}
                        />
                    </div>

                    {/* Anonymous Checkbox */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        <input
                            type="checkbox"
                            id="isAnonymous"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-600 cursor-pointer select-none">
                            匿名評價 (不公開您的暱稱與頭像)
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark hover:shadow-primary/40 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed text-lg"
                    >
                        {submitting ? '送出中...' : '送出評價'}
                    </button>
                    
                </form>

            </div>
        </div>
    );
};

export default OrderFeedbackPage;
