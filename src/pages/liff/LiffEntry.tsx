import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff } from '../../lib/liff';
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { generateState, generateNonce } from '../../utils/lineAuth';
import { 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Home, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

const LiffEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const [status, setStatus] = useState<'initializing' | 'logging_in' | 'verifying' | 'redirecting' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressText, setProgressText] = useState('正在為您連線 LINE 服務...');

  // Prevent double init with a ref
  const hasInitStarted = useRef(false);

  // Timeout watchdog
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (status === 'initializing' || status === 'verifying' || status === 'logging_in') {
      timeoutId = setTimeout(() => {
        console.warn('[LiffEntry] Timeout reached. Current status:', status);
        setErrorMessage(`系統回應逾時 (狀態: ${status})，請確認網路連線或稍後重新載入`);
        setStatus('error');
      }, 30000); // 30s timeout
    }
    return () => clearTimeout(timeoutId);
  }, [status]);

  // Single init effect - only depends on location
  useEffect(() => {
    if (hasInitStarted.current) {
      console.log('[LiffEntry] Init already started, skipping...');
      return;
    }
    hasInitStarted.current = true;

    console.log('[LiffEntry] Mounted. Location:', location.pathname, location.search);
    const queryParams = new URLSearchParams(location.search);
    
    let redirectPath = queryParams.get('redirect');
    
    // Fallback: Check if liff.state contains the path
    if (!redirectPath) {
      const liffState = queryParams.get('liff.state');
      if (liffState) {
        const decodedState = decodeURIComponent(liffState);
        if (decodedState.startsWith('/')) {
          redirectPath = decodedState;
        } else if (decodedState.startsWith('?')) {
          const stateParams = new URLSearchParams(decodedState);
          redirectPath = stateParams.get('redirect');
        }
      }
    }
    
    redirectPath = redirectPath || '/booking';
    console.log('[LiffEntry] Parsed redirectPath:', redirectPath);
    
    const code = queryParams.get('code');
    const state = queryParams.get('state');

    const init = async () => {
      console.log('[LiffEntry] init() started. Code:', code ? 'Yes' : 'No', 'State:', state ? 'Yes' : 'No');
      try {
        // Check if Firebase auth already resolved (persisted session)
        const { currentUser: existingUser } = useAuthStore.getState();
        if (existingUser) {
          console.log('[LiffEntry] Firebase already logged in. Redirecting...');
          setStatus('redirecting');
          setProgressText('登入成功，正在開啟專屬空間...');
          navigate(redirectPath, { replace: true });
          return;
        }

        console.log('[LiffEntry] Calling initializeLiff()...');
        setProgressText('正在啟動 LINE LIFF 環境...');
        const liff = await initializeLiff();
        
        if (!liff) {
          throw new Error('LIFF 初始化失敗');
        }
        console.log('[LiffEntry] LIFF Initialized. IsLoggedIn:', liff.isLoggedIn());

        if (!liff.isLoggedIn()) {
          setStatus('logging_in');
          setProgressText('準備跳轉 LINE 快速驗證...');
        }

        // Check again after LIFF init
        const { currentUser: currentAfterLiff } = useAuthStore.getState();
        if (currentAfterLiff) {
          console.log('[LiffEntry] Firebase now logged in. Redirecting...');
          navigate(redirectPath, { replace: true });
          return;
        }

        // --- Handle Implicit LIFF Login (In-App Browser) ---
        if (liff.isLoggedIn() && !code) {
          console.log('[LiffEntry] LIFF is logged in. Getting ID Token...');
          setStatus('verifying');
          setProgressText('正在安全驗證會員身分...');

          const idToken = liff.getIDToken();
          if (!idToken) {
            throw new Error('無法取得 LINE 授權 Token');
          }

          // Mock Token Handling
          if (idToken === 'mock_id_token') {
            console.log('⚠️ Mock Token detected. Signing in anonymously...');
            await signInAnonymously(auth);
            return;
          }

          let profile = null;
          try {
            profile = await liff.getProfile();
          } catch (e) {
            console.warn('[LiffEntry] Failed to get profile', e);
          }

          console.log('[LiffEntry] Sending ID Token to backend...');
          const response = await fetch('/api/line-liff-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              idToken,
              displayName: profile?.displayName,
              pictureUrl: profile?.pictureUrl,
              lineUserId: profile?.userId
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            console.error('[LiffEntry] Verify error:', errText);
            throw new Error(`身分驗證失敗: ${errText}`);
          }

          const { firebaseCustomToken } = await response.json();
          console.log('[LiffEntry] Got custom token. Signing in...');
          await signInWithCustomToken(auth, firebaseCustomToken);
          console.log('[LiffEntry] Sign in complete.');
          return;
        }

        // If not logged in AND no code, trigger OAuth login
        if (!liff.isLoggedIn() && !code) {
          console.log('[LiffEntry] Triggering OAuth redirect...');
          const authState = generateState();
          const nonce = generateNonce();
          sessionStorage.setItem('line_auth_state', authState);
          sessionStorage.setItem('line_auth_nonce', nonce);

          const fixedRedirectPath = '/liff';
          const redirectUri = window.location.origin + fixedRedirectPath;
          
          const returnPath = redirectPath; 
          const stateValue = '?' + new URLSearchParams({ 
            s: authState, 
            redirect: returnPath 
          }).toString();

          const params = new URLSearchParams({
            response_type: 'code',
            client_id: LINE_CHANNEL_ID || '',
            redirect_uri: redirectUri,
            state: stateValue,
            scope: 'profile openid email',
            nonce: nonce,
            bot_prompt: 'normal', 
          });

          const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
          console.log('[LiffEntry] Redirecting to:', loginUrl);
          window.location.href = loginUrl;
          return;
        }
        
        // If we have code and state, exchange it
        if (code && state) {
          console.log('[LiffEntry] Starting Token Exchange...');
          setStatus('verifying');
          setProgressText('正在同步您的會員資料...');
          
          const fixedRedirectPath = '/liff';
          const redirectUri = window.location.origin + fixedRedirectPath;
          
          console.log('[LiffEntry] sending fetch to /api/line-oauth-auth');
          const response = await fetch('/api/line-oauth-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });

          console.log('[LiffEntry] Fetch complete. Status:', response.status);

          if (!response.ok) {
            const errText = await response.text();
            console.error('[LiffEntry] Fetch error body:', errText);
            throw new Error(`授權交換失敗: ${errText}`);
          }
          
          setProgressText('驗證成功，正在登入系統...');
          const { firebaseCustomToken } = await response.json();
          console.log('[LiffEntry] Got custom token. Signing in...');
          await signInWithCustomToken(auth, firebaseCustomToken);
          console.log('[LiffEntry] Sign in complete.');
        }

      } catch (err: any) {
        console.error('[LiffEntry] Caught Error:', err);
        setErrorMessage(err.message || '連線時發生未知錯誤');
        setStatus('error');
      }
    };

    init();
  }, [location]);

  // Separate effect to handle redirect when auth state changes
  useEffect(() => {
    if (hasInitStarted.current && currentUser && status !== 'redirecting') {
      const queryParams = new URLSearchParams(location.search);
      let redirectPath = queryParams.get('redirect') || '/booking';
      setStatus('redirecting');
      setProgressText('登入成功，正在開啟專屬空間...');
      const timer = setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  // Status Stepper Index
  const getStepIndex = () => {
    switch (status) {
      case 'initializing': return 1;
      case 'logging_in': return 2;
      case 'verifying': return 3;
      case 'redirecting': return 4;
      default: return 1;
    }
  };

  const stepIndex = getStepIndex();

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-text-main relative overflow-hidden">
        {/* Top Ambient Glow */}
        <div className="absolute top-0 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 border border-[#EFECE5] shadow-medium text-center space-y-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-serif font-bold text-gray-900">LINE 授權連線中斷</h2>
            <p className="text-xs text-text-light leading-relaxed break-words">
              {errorMessage || '請檢查網路連線或重新登入嘗試'}
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-3 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新載入連線</span>
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full py-3 bg-[#FAF9F6] hover:bg-[#EFECE5] text-text-main border border-[#EFECE5] text-xs sm:text-sm font-medium rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#9F9586]" />
              <span>回到首頁</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-between p-6 sm:p-10 text-text-main relative overflow-hidden select-none">
      
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-96 bg-gradient-to-b from-[#EFECE5]/80 via-[#FAF9F6]/40 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Placeholder */}
      <div className="w-full max-w-sm pt-4 flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 backdrop-blur-md text-[#8A8173] border border-[#EFECE5] shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#06C755]" />
          LINE 官方安全授權連線
        </span>
      </div>

      {/* Central Brand & Pulse Card */}
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 my-auto">
        
        {/* Animated Brand Emblem */}
        <div className="relative">
          {/* Pulsing Ripple Rings */}
          <motion.div 
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full bg-[#9F9586]/20 -m-4"
          />
          <motion.div 
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute inset-0 rounded-full bg-[#9F9586]/20 -m-2"
          />

          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#9F9586] to-[#8A8173] p-1 shadow-lg relative flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#9F9586] animate-pulse" />
              <span className="text-[10px] font-serif font-bold text-gray-900 tracking-wider mt-0.5">TREERING</span>
            </div>
          </div>
        </div>

        {/* Salon Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-tight">
            TREERING
          </h1>
          <p className="text-xs text-text-light font-medium">
            自然・精緻・專屬美麗空間
          </p>
        </div>

        {/* Dynamic Status Display */}
        <div className="w-full bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-[#EFECE5] shadow-soft space-y-3">
          <div className="flex items-center justify-center gap-2">
            {status === 'redirecting' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9F9586] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9F9586]"></span>
              </span>
            )}
            <p className="text-xs sm:text-sm font-bold text-gray-800 tracking-wide">
              {progressText}
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full overflow-hidden border border-[#EFECE5]">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#9F9586] to-[#8A8173] rounded-full"
              initial={{ width: '25%' }}
              animate={{ width: `${stepIndex * 25}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-text-light/80 px-0.5">
            <span className={stepIndex >= 1 ? 'text-[#9F9586] font-bold' : ''}>連線服務</span>
            <span className={stepIndex >= 2 ? 'text-[#9F9586] font-bold' : ''}>LINE 驗證</span>
            <span className={stepIndex >= 3 ? 'text-[#9F9586] font-bold' : ''}>身分同步</span>
            <span className={stepIndex >= 4 ? 'text-emerald-600 font-bold' : ''}>登入成功</span>
          </div>
        </div>

      </div>

      {/* Footer Security Guarantee */}
      <div className="w-full max-w-sm pb-2 text-center">
        <p className="text-[11px] text-text-light/70 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-text-light/60" />
          <span>LINE Official Certified Partner | 安全加密連線</span>
        </p>
      </div>

    </div>
  );
};

export default LiffEntry;
