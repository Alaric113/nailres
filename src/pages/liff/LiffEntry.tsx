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
        console.log('[LiffEntry] Current location:', location.pathname, location.search);
        const queryParams = new URLSearchParams(location.search);
        
        let redirectPath = queryParams.get('redirect');
        
        // Fallback: Check if liff.state contains the path (LINE sometimes moves params here)
        if (!redirectPath) {
            const liffState = queryParams.get('liff.state');
            if (liffState) {
                // liff.state is often URL encoded
                const decodedState = decodeURIComponent(liffState);
                
                // Case 1: State is a direct path (e.g. /member)
                if (decodedState.startsWith('/')) {
                    redirectPath = decodedState;
                } 
                // Case 2: State is a query string (e.g. ?redirect=/member)
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
            try {
                if (currentUser) {
                    setStatus('redirecting');
                    navigate(redirectPath, { replace: true });
                    return;
                }

                console.log('Initializing LIFF...');
                const liff = await initializeLiff();
                
                if (!liff) {
                    throw new Error('LIFF init returned null');
                }

                if (!liff.isLoggedIn()) {
                   setStatus('logging_in');
                   liffLogin(window.location.href);
                   return;
                }

                if (!code) {
                     const state = generateState();
                     const nonce = generateNonce();
                     sessionStorage.setItem('line_auth_state', state);
                     sessionStorage.setItem('line_auth_nonce', nonce);

                     // FORCE Redirect URI to be /booking (must match LINE Console)
                     const fixedRedirectPath = '/booking';
                     const redirectUri = window.location.origin + fixedRedirectPath;
                     
                     // Embed return path in state
                     // Format: ?s=RANDOM_STATE&redirect=/current/path
                     const returnPath = window.location.pathname + location.search;
                     const stateValue = '?' + new URLSearchParams({ 
                         s: state, 
                         redirect: returnPath 
                     }).toString();

                     const params = new URLSearchParams({
                        response_type: 'code',
                        client_id: LINE_CHANNEL_ID || '',
                        redirect_uri: redirectUri,
                        state: stateValue,
                        scope: 'profile openid email',
                        nonce: nonce,
                        bot_prompt: 'normal', // Force consent screen to debug? Or 'normal'
                     });

                     const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
                     window.location.href = loginUrl;
                     return;
                }
                
                if (code && state) {
                     // We need to pass the EXACT SAME redirectUri used in step 1
                     const fixedRedirectPath = '/booking';
                     const redirectUri = window.location.origin + fixedRedirectPath;
                     
                     const response = await fetch('/api/line-oauth-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri }),
                      });
            
                      if (!response.ok) {
                          const errText = await response.text();
                          throw new Error(`Exchange Failed: ${errText}`);
                      }
                      const { firebaseCustomToken } = await response.json();
                      await signInWithCustomToken(auth, firebaseCustomToken);
                }

            } catch (err: any) {
                console.error(err);
                setErrorMessage(err.message || 'Error occurred');
                setStatus('error');
            }
        };

        const timeoutId = setTimeout(() => {
            if (status === 'initializing') {
                setErrorMessage('系統回應逾時');
                setStatus('error');
            }
        }, 10000);

        // Defer init slightly to ensure rendering happens
        setTimeout(() => {
             if (!currentUser) init();
             else navigate(redirectPath, { replace: true });
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [currentUser, navigate, location]);

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
            <LoadingSpinner size="lg" text="正在為您登入..." />
        </div>
    );
};

export default LiffEntry;
