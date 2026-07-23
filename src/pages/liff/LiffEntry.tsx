import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff } from '../../lib/liff';
import { signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { generateState, generateNonce } from '../../utils/lineAuth';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

const LiffEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuthStore();
    const [status, setStatus] = useState<'initializing' | 'logging_in' | 'verifying' | 'redirecting' | 'error'>('initializing');
    const [errorMessage, setErrorMessage] = useState('');
    const [progressText, setProgressText] = useState('正在為您登入...');

    // Prevent double init with a ref
    const hasInitStarted = useRef(false);

    // Timeout watchdog
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (status === 'initializing' || status === 'verifying' || status === 'logging_in') {
            timeoutId = setTimeout(() => {
                console.warn('[LiffEntry] Timeout reached. Current status:', status);
                setErrorMessage(`系統回應逾時 (狀態: ${status})，請檢查網路連線或稍後再試`);
                setStatus('error');
            }, 30000); // 30s timeout
        }
        return () => clearTimeout(timeoutId);
    }, [status]);

    // Single init effect - only depends on location
    useEffect(() => {
        // If init already started, skip (prevents double execution from auth changes)
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
                } 
                else if (decodedState.startsWith('?')) {
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
                    setProgressText('登入成功，正在跳轉...');
                    navigate(redirectPath, { replace: true });
                    return;
                }

                console.log('[LiffEntry] Calling initializeLiff()...');
                setProgressText('正在初始化 LIFF...');
                const liff = await initializeLiff();
                
                if (!liff) {
                    throw new Error('LIFF init returned null');
                }
                console.log('[LiffEntry] LIFF Initialized. IsLoggedIn:', liff.isLoggedIn());

                if (!liff.isLoggedIn()) {
                   setStatus('logging_in');
                   setProgressText('準備 LINE 登入...');
                }

                // Check again after LIFF init - Firebase might have resolved while we were waiting
                const { currentUser: currentAfterLiff } = useAuthStore.getState();
                if (currentAfterLiff) {
                    console.log('[LiffEntry] Firebase now logged in (resolved during LIFF init). Redirecting...');
                    navigate(redirectPath, { replace: true });
                    return;
                }

                // --- Handle Implicit LIFF Login (In-App Browser) ---
                if (liff.isLoggedIn() && !code) {
                     console.log('[LiffEntry] LIFF is logged in. Getting ID Token...');
                     setStatus('verifying');
                     setProgressText('正在驗證 LIFF 身分...');

                     const idToken = liff.getIDToken();
                     if (!idToken) {
                         throw new Error('LIFF ID Token is missing');
                     }

                     // Mock Token Handling
                     if (idToken === 'mock_id_token') {
                        console.log('⚠️ Mock Token detected. Signing in anonymously...');
                        await signInAnonymously(auth);
                        // Profile creation will be handled by useAuth hook automatically
                        return;
                     }

                     let profile = null;
                     try {
                         // Attempt to get profile (optional but good for syncing name/avatar)
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
                          throw new Error(`LIFF Verify Failed: ${errText}`);
                      }

                      const { firebaseCustomToken } = await response.json();
                      console.log('[LiffEntry] Got custom token. Signing in...');
                      await signInWithCustomToken(auth, firebaseCustomToken);
                      console.log('[LiffEntry] Sign in complete.');
                      return;
                }

                // If not logged in AND no code, we need to trigger login
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
                     setProgressText('正在驗證身分...');
                     
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
                          throw new Error(`Exchange Failed: ${errText}`);
                      }
                      
                      setProgressText('取得使用者資料...');
                      const { firebaseCustomToken } = await response.json();
                      console.log('[LiffEntry] Got custom token. Signing in...');
                      await signInWithCustomToken(auth, firebaseCustomToken);
                      console.log('[LiffEntry] Sign in complete.');
                }

            } catch (err: any) {
                console.error('[LiffEntry] Caught Error:', err);
                setErrorMessage(err.message || 'Error occurred');
                setStatus('error');
            }
        };

        // Start init immediately (no setTimeout delay)
        init();

    }, [location]); // Only depend on location, NOT currentUser

    // Separate effect to handle redirect when auth state changes (after init is done)
    useEffect(() => {
        // Only redirect if init has already started and user is logged in
        if (hasInitStarted.current && currentUser && status !== 'redirecting') {
            const queryParams = new URLSearchParams(location.search);
            let redirectPath = queryParams.get('redirect') || '/booking';
            setStatus('redirecting');
            setProgressText('登入成功，正在跳轉...');
            const timer = setTimeout(() => {
                navigate(redirectPath, { replace: true });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentUser]); // Only run when currentUser changes

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-[#FAF9F6]">
                <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-sm">
                    <p className="text-red-600 mb-4 font-bold">啟動失敗</p>
                    <p className="text-gray-600 text-sm mb-6 break-words">{errorMessage}</p>
                    <div className="space-y-3">
                        <button onClick={() => window.location.reload()} className="w-full bg-[#9F9586] text-white px-4 py-2 rounded-lg">重試</button>
                        <button onClick={() => navigate('/')} className="w-full border border-gray-300 text-gray-600 px-4 py-2 rounded-lg">回首頁</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#FAF9F6]">
            <LoadingSpinner size="lg" text={progressText} />
        </div>
    );
};

export default LiffEntry;
