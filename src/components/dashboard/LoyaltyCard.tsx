import { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LoyaltyCardProps {
    previewBackground?: string; // New prop for preview
}

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({ previewBackground }) => {
  const { userProfile } = useAuthStore();
  const loyaltyPoints = userProfile?.loyaltyPoints || 0;
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  
  // Default fallback avatar
  const defaultAvatar = 'https://firebasestorage.googleapis.com/v0/b/nail-62ea4.firebasestorage.app/o/user-solid.svg?alt=media&token=e5336262-2473-4888-a741-055155153a63';

  // Determine membership tier (simple logic for now)
  const role = userProfile?.role;
  const tierName = role === 'platinum' ? '白金會員' : role === 'admin' ? '管理員' : role === 'manager' ? '管理設計師' : role === 'designer' ? '設計師' : '一般會員'; // could be dynamic based on points later

  useEffect(() => {
    // If previewBackground is provided, use it directly and skip fetching
    if (previewBackground) {
        setBackgroundImage(previewBackground);
        return;
    }

    const fetchBackground = async () => {
        try {
            const docRef = doc(db, 'globals', 'homepageImages');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().loyaltyCardBackground) {
                setBackgroundImage(docSnap.data().loyaltyCardBackground);
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchBackground();
  }, [previewBackground]); // Re-run if previewBackground changes

  return (
    <div 
      className="relative overflow-hidden bg-[#9F9586] rounded-2xl shadow-xl text-white p-6 sm:p-8 transition-all hover:shadow-2xl h-full min-h-[220px] flex flex-col bg-center bg-no-repeat"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: '100% 100%' } : {}}
    >
      {/* Overlay for readability if image is present */}
      {!backgroundImage && <div className="absolute inset-0 bg-black/40 z-0"></div>}

      {/* Decorative Background Elements (Only if no custom background) */}
      {!backgroundImage && (
        <>
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        </>
      )}
      
      <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]"> 
        {/* Card Header: User Info & Tier */}
        <div className="flex items-center justify-between mb-4"> 
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src={userProfile?.profile.avatarUrl || defaultAvatar}
                alt="User Avatar"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white/30 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 bg-white text-[#9F9586] rounded-full p-0.5 shadow-sm">
                <StarIcon className="w-3 h-3" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-serif font-bold tracking-wide">
                {userProfile?.profile.displayName || '親愛的會員'}
              </h2>
            
            </div>
          </div>
          
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-medium tracking-wide">
              {tierName}
            </span>
          </div>
        </div>
        
        {/* Card Body: Points & Description */}
        <div className="flex items-end justify-between"> 
          <div className="flex flex-col"> {/* New div to hold points AND description */}
            <div className="text-sm text-white font-medium mb-1">目前累積點數</div>
            {/* Description moved here */}
            <p className="text-white/80 font-light text-xs sm:text-xs  mt-1"> 
              每消費 $1,000 累積 1 點
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-serif font-bold leading-none">
                {loyaltyPoints}
              </span>
              <span className="text-lg opacity-80 font-medium">pt</span>
            </div>
            
          </div>
          
          <div className="flex items-end"> {/* Only "查看兌換紀錄" button here */}
            <button className="flex hidden items-center gap-1 text-white hover:text-white/80 transition-colors font-medium group text-xs">
              查看兌換紀錄
              <ChevronRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyCard;
