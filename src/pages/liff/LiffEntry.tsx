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
                const liff = await initializeLiff();
                
                if (!liff) {
                    throw new Error('LIFF initialization failed');
                }

                if (!liff.isLoggedIn()) {
                   // Not logged in -> trigger LINE login
                   setStatus('logging_in');
                   // Pass current URL as redirect to come back here after login
                   liffLogin(window.location.href);
                   return;
                }

                // If we are here, we are logged in to LIFF (SDK) but might not have the 'code' for Firebase custom token exchange.
                // Our backend /api/line-oauth-auth relies on 'code'.
                // liff.login() inside the LINE app DOES NOT redirect by default, so we don't get the code.
                // We must FORCE a standard OAuth redirect to get the code.

                if (!code) {
                     // Force manual redirect to LINE Login to get 'code'
                     const state = generateState();
                     const nonce = generateNonce();
                     sessionStorage.setItem('line_auth_state', state);
                     sessionStorage.setItem('line_auth_nonce', nonce);

                     const redirectUri = window.location.origin + window.location.pathname + location.search;
                     
                     // Construct OAuth URL
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
                
                // If we HAVE code, proceed to exchange it
                if (code && state) {
                     // We have auth code, exchange it like Login.tsx does
                     // Note: You can enable state validation if you saved it before redirect
                     // const storedState = sessionStorage.getItem('line_auth_state');
                     // if (storedState && state !== storedState) throw new Error('State mismatch');

                     // Fix Token Exchange Error: Redirect URI Mismatch
                     // We must reconstruct the EXACT redirect_uri used in the authorize request.
                     // The authorize request used: origin + pathname + (original params).
                     // But NOW, location.search contains code & state.
                     // So we must STRIP code & state to get back to the original URI.
                     
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
            
                      if (!response.ok) throw new Error('Token exchange failed');
                      const { firebaseCustomToken } = await response.json();
                      await signInWithCustomToken(auth, firebaseCustomToken);
                      
                      console.log('[LiffEntry] Token exchanged, redirecting to:', redirectPath);
                      setStatus('redirecting');
                      navigate(redirectPath, { replace: true });
                }

            } catch (err: any) {
                console.error(err);
                setErrorMessage(err.message || 'Auto-login failed');
                setStatus('error');
            }
        };

        if (!currentUser) {
             init();
        } else {
             navigate(redirectPath, { replace: true });
        }
    }, [currentUser, navigate, location]);

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-screen bg-[#FAF9F6]">
                <p className="text-red-600 mb-4">{errorMessage}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-[#9F9586] text-white px-4 py-2 rounded"
                >
                    重試
                </button>
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
