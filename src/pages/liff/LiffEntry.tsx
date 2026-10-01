import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff } from '../../lib/liff';
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { resolveLiffTarget, isPublicStoreTarget, requiresLiffBootstrap } from '../../utils/liffRoute';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageLoadError from '../../components/common/PageLoadError';
import { reopenCurrentPage } from '../../utils/pageRecovery';
import { 
  Sparkles, 
  ShieldCheck, 
  RefreshCw, 
  Home, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

const StoreInfoPage = lazy(() => import('../StoreInfoPage'));

const LiffEntry = () => {
  const location = useLocation();
  const redirectPath = resolveLiffTarget(location.pathname, location.search);
  const publicStore = isPublicStoreTarget(redirectPath);
  const needsBootstrap = requiresLiffBootstrap(location.search, window.location.hash);
  const entryKey = location.pathname + location.search;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!publicStore && !needsBootstrap) return;
    let active = true;
    const timer = setTimeout(() => {
      if (active) setFailedKey(entryKey);
      active = false;
    }, 30000);
    // Public content can render now. Keep the URL intact while LINE consumes its credentials.
    initializeLiff().then(liff => {
      if (!active) return;
      clearTimeout(timer);
      if (liff) setReadyKey(entryKey);
      else setFailedKey(entryKey);
    });
    return () => { active = false; clearTimeout(timer); };
  }, [entryKey, publicStore, needsBootstrap]);

  if (publicStore) {
    return <Suspense fallback={<LoadingSpinner text="正在開啟店家資訊..." fullScreen />}><StoreInfoPage /></Suspense>;
  }
  if (needsBootstrap && failedKey === entryKey) return <PageLoadError />;
  if (needsBootstrap && readyKey !== entryKey) return <LoadingSpinner text="正在開啟 LINE 頁面..." fullScreen />;
  return <LiffLogin redirectPath={redirectPath} />;
};

const LiffLogin = ({ redirectPath }: { redirectPath: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const [status, setStatus] = useState<'initializing' | 'logging_in' | 'verifying' | 'redirecting' | 'error'>('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const [progressText, setProgressText] = useState('正在為您連線 LINE 服務...');

  const redirectedTo = useRef<string | null>(null);
  const hasFailed = useRef(false);
  const requestController = useRef<AbortController | null>(null);

  const finishLogin = useCallback(() => {
    if (hasFailed.current || redirectedTo.current === redirectPath) return;
    redirectedTo.current = redirectPath;
    setStatus('redirecting');
    setProgressText('登入成功，正在開啟專屬空間...');
    navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  // Timeout watchdog
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (status === 'initializing' || status === 'verifying' || status === 'logging_in') {
      timeoutId = setTimeout(() => {
        console.warn('[LiffEntry] Timeout reached. Current status:', status);
        hasFailed.current = true;
        requestController.current?.abort();
        setErrorMessage(`系統回應逾時 (狀態: ${status})，請確認網路連線或稍後重新載入`);
        setStatus('error');
      }, 30000); // 30s timeout
    }
    return () => clearTimeout(timeoutId);
  }, [status]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    requestController.current = controller;
    hasFailed.current = false;
    const isActive = () => active && !hasFailed.current && redirectedTo.current !== redirectPath;
    const init = async () => {
      try {
        if (!isActive()) return;
        // Check if Firebase auth already resolved (persisted session)
        const { currentUser: existingUser } = useAuthStore.getState();
        if (existingUser) {
          console.log('[LiffEntry] Firebase already logged in. Redirecting...');
          finishLogin();
          return;
        }

        console.log('[LiffEntry] Calling initializeLiff()...');
        setStatus('initializing');
        setProgressText('正在啟動 LINE LIFF 環境...');
        // Restore Firebase concurrently with LIFF, before exchanging another token.
        const liffReady = initializeLiff();
        await auth.authStateReady();
        if (!isActive()) return;
        if (auth.currentUser || useAuthStore.getState().currentUser) {
          finishLogin();
          return;
        }

        const liff = await liffReady;
        if (!isActive()) return;
        
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
        if (auth.currentUser || currentAfterLiff) {
          console.log('[LiffEntry] Firebase now logged in. Redirecting...');
          finishLogin();
          return;
        }

        // --- Handle Implicit LIFF Login (In-App Browser) ---
        if (liff.isLoggedIn()) {
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

          console.log('[LiffEntry] Sending ID Token to backend...');
          const response = await fetch('/api/line-liff-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            // The server obtains profile data from LINE's verified ID token.
            body: JSON.stringify({ idToken }),
          });
          if (!isActive()) return;

          if (!response.ok) {
            const errText = await response.text();
            console.error('[LiffEntry] Verify error:', errText);
            throw new Error(`身分驗證失敗: ${errText}`);
          }

          const { firebaseCustomToken } = await response.json();
          if (!isActive()) return;
          console.log('[LiffEntry] Got custom token. Signing in...');
          await signInWithCustomToken(auth, firebaseCustomToken);
          console.log('[LiffEntry] Sign in complete.');
          return;
        }

        if (liff.isInClient()) {
          throw new Error('LINE 授權已失效，請關閉此視窗後，從圖文選單重新開啟。');
        }

        // The SDK owns its OAuth state and code exchange. Do not reuse callback parameters.
        const returnUrl = new URL(location.pathname, window.location.origin);
        returnUrl.searchParams.set('redirect', redirectPath);
        liff.login({ redirectUri: returnUrl.toString() });

      } catch (err: unknown) {
        if (!isActive()) return;
        hasFailed.current = true;
        console.error('[LiffEntry] Caught Error:', err);
        setErrorMessage(err instanceof Error ? err.message : '連線時發生未知錯誤');
        setStatus('error');
      }
    };

    init();
    return () => {
      active = false;
      controller.abort();
    };
  }, [location.pathname, location.search, redirectPath, finishLogin]);

  // Separate effect to handle redirect when auth state changes
  useEffect(() => {
    if (currentUser) finishLogin();
  }, [currentUser, finishLogin]);

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
              onClick={() => void reopenCurrentPage()}
              className="w-full py-3 bg-[#9F9586] hover:bg-[#8A8173] text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新開啟連線</span>
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
