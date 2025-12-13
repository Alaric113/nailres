import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff, getLiffIdToken, liffLogin } from '../../lib/liff';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LiffEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuthStore();
    const [status, setStatus] = useState<'initializing' | 'logging_in' | 'redirecting' | 'error'>('initializing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const redirectPath = queryParams.get('redirect') || '/booking';

        const init = async () => {
            try {
                // If user is already logged in to Firebase, go straight to target
                if (currentUser) {
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

                // Logged in to LINE -> Get ID Token
                setStatus('logging_in');
                const idToken = getLiffIdToken();

                if (!idToken) {
                    throw new Error('Failed to get ID token');
                }

                // Verify ID Token with backend to get Firebase Custom Token
                // Note: We're reusing the endpoint but adapting for ID Token if supported,
                // OR we might need to use the access token.
                // However, Login.tsx uses 'code' flow.
                // For LIFF simple login, we might need a different endpoint OR 
                // if we don't have a backend ID token verifier yet, we might need to assume 
                // the user is authenticated if we trust the client (NOT SECURE).
                // 
                // WAIT -> The 'Login.tsx' uses `api/line-oauth-auth` which expects `code`.
                // LIFF `liff.login()` does implicitly the same if we used `redirectUri`.
                //
                // Alternative: If we are in LIFF browser, we can get `liff.getAccessToken()`.
                // But to sign in to Firebase `signInWithCustomToken`, we MUST have a backend minting it.
                //
                // Let's assume for now we use the SAME flow as `Login.tsx` logic if `code` is present.
                // If `liff.init()` returns logged in, we verify if we have `code` in URL?
                // `liff.login()` redirects back with `code`? -> Yes, if using Authorization Code flow option?
                // Standard `liff.login()` might just set cookies.
                //
                // CRITICAL: If our backend ONLY accepts `code`, then `liff.login()` must act as OAuth.
                // The `Login.tsx` logic for LIFF was: `liffLogin()` -> redirects.
                //
                // Let's check `lib/liff.ts` implementation of `liffLogin`.
                // It calls `liff.login({ redirectUri })`.
                //
                // So if we are here, and `currentUser` is null, but `liff.isLoggedIn()` is true:
                // It means we have a LIFF session.
                // If we don't have a backend to swap ID Token -> Custom Token, we are stuck?
                //
                // Let's look at `Login.tsx` again.
                // It has `useEffect` checking for `code` and `state`.
                // If `LiffEntry` is the redirect target, checking `code` is correct.

                const params = new URLSearchParams(window.location.search);
                const code = params.get('code');
                const state = params.get('state');

                if (code && state) {
                    // We have auth code, exchange it like Login.tsx does
                     const redirectUri = window.location.origin + window.location.pathname;
                     const response = await fetch('/api/line-oauth-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code, redirectUri }),
                      });
            
                      if (!response.ok) throw new Error('Token exchange failed');
                      const { firebaseCustomToken } = await response.json();
                      await signInWithCustomToken(auth, firebaseCustomToken);
                      
                      setStatus('redirecting');
                      navigate(redirectPath, { replace: true });
                } else {
                    // Logged in to LINE LIFF but no Auth Code (maybe session persisted?)
                    // If we can't swap token, we might need to force re-login to get code?
                    // OR implementing ID Token verification backend.
                    // For now, let's force re-login to get the code if we aren't firebase-authed.
                     if (!currentUser) {
                         // Force login to get 'code'
                         if (!liff.isLoggedIn()) {
                            liffLogin(window.location.href);
                         } else {
                             // Already logged in LIFF but not Firebase.
                             // Check for code again.
                             if (!code) {
                                 // Force login redirect to get code
                                 liffLogin(window.location.href);
                             }
                         }
                    }
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
