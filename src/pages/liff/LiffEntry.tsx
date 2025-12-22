import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff, liffLogin } from '../../lib/liff';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { generateState, generateNonce } from '../../utils/lineAuth';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

const LiffEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuthStore();
    const [status, setStatus] = useState<'initializing' | 'logging_in' | 'redirecting' | 'error'>('initializing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const redirectPath = queryParams.get('redirect') || '/booking';
        const code = queryParams.get('code');
        const state = queryParams.get('state');

        console.log('[LiffEntry] Debug:', { search: location.search, redirectPath, code, hasUser: !!currentUser });

        const init = async () => {
            try {
                // If user is already logged in to Firebase, go straight to target
                if (currentUser) {
                    console.log('[LiffEntry] User logged in, redirecting to:', redirectPath);
                    setStatus('redirecting');
                    navigate(redirectPath, { replace: true });
                    return;
                }

                // Initialize LIFF
                console.log('[LiffEntry] Initializing LIFF...');
                const liff = await initializeLiff();
                
                if (!liff) {
                    throw new Error('LIFF initialization failed (liff object is null). Check VITE_LIFF_ID.');
                }

                if (!liff.isLoggedIn()) {
                   console.log('[LiffEntry] Not logged in to LIFF, redirecting to login...');
                   setStatus('logging_in');
                   liffLogin(window.location.href);
                   return;
                }

                console.log('[LiffEntry] LIFF Logged In. Code:', code);

                if (!code) {
                     // Force manual redirect to LINE Login to get 'code'
                     const state = generateState();
                     const nonce = generateNonce();
                     sessionStorage.setItem('line_auth_state', state);
                     sessionStorage.setItem('line_auth_nonce', nonce);

                     const redirectUri = window.location.origin + window.location.pathname + location.search;
                     
                     const params = new URLSearchParams({
                        response_type: 'code',
                        client_id: LINE_CHANNEL_ID || '',
                        redirect_uri: redirectUri,
                        state: state,
                        scope: 'profile openid email',
                        nonce: nonce,
                        bot_prompt: 'normal',
                     });

                     const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
                     window.location.href = loginUrl;
                     return;
                }
                
                if (code && state) {
                     const cleanParams = new URLSearchParams(location.search);
                     cleanParams.delete('code');
                     cleanParams.delete('state');
                     cleanParams.delete('liffClientId');
                     cleanParams.delete('liffRedirectUri');

                     const baseSearch = cleanParams.toString();
                     const searchPart = baseSearch ? `?${baseSearch}` : '';
                     const redirectUri = window.location.origin + window.location.pathname + searchPart;
                     
                     const response = await fetch('/api/line-oauth-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri }),
                      });
            
                      if (!response.ok) {
                          const errText = await response.text();
                          throw new Error(`Token exchange failed: ${errText}`);
                      }
                      const { firebaseCustomToken } = await response.json();
                      await signInWithCustomToken(auth, firebaseCustomToken);
                      
                      console.log('[LiffEntry] Token exchanged success.');
                      // Do NOT navigate here. Wait for currentUser to update.
                }

            } catch (err: any) {
                console.error('[LiffEntry Error]', err);
                setErrorMessage(err.message || 'Initialization failed');
                setStatus('error');
            }
        };

        // SAFETY TIMEOUT: If nothing happens for 10 seconds, show error
        const timeoutId = setTimeout(() => {
            if (status === 'initializing') {
                setErrorMessage('系統回應逾時，請檢查網路或重試。');
                setStatus('error');
            }
        }, 10000);

        if (!currentUser) {
             init();
        } else {
             navigate(redirectPath, { replace: true });
        }

        return () => clearTimeout(timeoutId);
    }, [currentUser, navigate, location]); // Ensure 'status' is not in dependency array to avoid loops, or handle carefully

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-[#FAF9F6]">
                <div className="bg-white p-6 rounded-xl shadow-sm text-center max-w-sm">
                    <p className="text-red-600 mb-4 font-bold">啟動失敗</p>
                    <p className="text-gray-600 text-sm mb-6 break-words">{errorMessage}</p>
                    <div className="space-y-3">
                        <button 
                        onClick={() => window.location.reload()}
                        className="w-full bg-[#9F9586] text-white px-4 py-2 rounded-lg hover:bg-[#8a8174] transition-colors"
                        >
                            重試
                        </button>
                        <button 
                        onClick={() => navigate('/')}
                        className="w-full border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            回首頁
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#FAF9F6]">
            <LoadingSpinner size="lg" text="正在為您登入..." />
        </div>
    );
};

export default LiffEntry;
