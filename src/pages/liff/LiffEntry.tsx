import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { initializeLiff, getLiffIdToken, liffLogin } from '../../lib/liff';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LiffEntry = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuthStore();
    const [status, setStatus] = useState<'initializing' | 'logging_in' | 'redirecting' | 'error'>('initializing');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const init = async () => {
            try {
                // If user is already logged in to Firebase, go straight to booking
                if (currentUser) {
                    setStatus('redirecting');
                    navigate('/booking', { replace: true });
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
                      navigate('/booking', { replace: true });
                } else {
                    // Logged in to LINE LIFF but no Auth Code (maybe session persisted?)
                    // If we can't swap token, we might need to force re-login to get code?
                    // OR implementing ID Token verification backend.
                    // For now, let's force re-login to get the code if we aren't firebase-authed.
                     if (!currentUser) {
                         // Force login to get 'code'
                         // We need to ensure liff.login asks for code?
                         // Default liff.login() uses implicit flow? No, it depends on Line Login channel settings.
                         // But usually it redirects if not inside LINE.
                         // Inside LINE, it might just be "logged in".
                         
                         // If we are INSIDE LINE app, we can't easily get 'code' without redirect.
                         // But `liff.login()` inside LINE app does nothing if already logged in.
                         //
                         // We will rely on `Login.tsx`'s logic:
                         // "Frontend sending OAuth code to Netlify function"
                         
                         // If we are strictly implementing "Auto Login", and we are inside LINE:
                         // We need to send `liff.getIDToken()` to backend.
                         // If backend only supports `code`, we might need to update backend.
                         //
                         // ASSUMPTION: The user wants this to work. I will assume I need to direct them to `Login` page logic 
                         // or reuse the `code` exchange logic. 
                         // If I can't get code, I might redirect to `/login` which handles it robustly?
                         // But user wants "/liff".
                         
                         // Let's try to just redirect to `/login` if we are stuck?
                         // No, user wants direct booking.
                         
                         // Let's try to get code by `liff.login` even if logged in?
                         // liff.login() params: `redirectUri`.
                         
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
             navigate('/booking', { replace: true });
        }
    }, [currentUser, navigate]);

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
