import  { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '../../lib/firebase'; // Added db
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'; // Added constants
import { isLiffBrowser, liffLogin } from '../../lib/liff';
import { generateNonce, generateState } from '../../utils/lineAuth';
import { motion } from 'framer-motion';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

export const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isOAuthProcessing = useRef(false);

  // Helper to check for PWA Standalone Mode
  const isPwa = () => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  };

  const exchangeCodeForToken = async (code: string, state: string) => {
      if (isOAuthProcessing.current) return;
      isOAuthProcessing.current = true;
      setIsSubmitting(true);

      const redirectUri = window.location.origin + location.pathname; 

      try {
          const storedState = localStorage.getItem('line_oauth_state');
          if (!storedState || storedState !== state) throw new Error('State mismatch.');

          const response = await fetch('/api/line-oauth-auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri, state }), // Sending state to API
          });

          if (!response.ok) throw new Error('Failed to get token.');
          const { firebaseCustomToken } = await response.json();
          await signInWithCustomToken(auth, firebaseCustomToken);
          localStorage.removeItem('line_oauth_state');
          
          // If we are in a popup, try to close self after success
          if (window.opener || window.history.length > 1) {
             // Optional: Display success message before closing?
             // window.close() often blocked if not opened by script, but here it likely was.
             window.close();
          }
           navigate('/', { replace: true });

      } catch (err: any) {
          console.error(err);
          showToast(`LINE 登入失敗：${err.message}`, 'error');
          navigate(location.pathname, { replace: true });
      } finally {
          setIsSubmitting(false);
          isOAuthProcessing.current = false;
      }
  };

  // 1. Listen for PostMessage from Popup (Parent Window Logic - Fallback)
  useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type === 'LINE_AUTH_CODE' && event.data?.code && event.data?.state) {
               console.log("Received code from popup");
               exchangeCodeForToken(event.data.code, event.data.state);
          }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 2. Handle Redirect Params (Popup Child Logic OR Normal Redirect Logic)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code && state) {
        // A. Popup Child Mode
        if (window.opener) {
            console.log("Posting message to opener");
            window.opener.postMessage({ type: 'LINE_AUTH_CODE', code, state }, window.location.origin);
            // We STILL allow execution to proceed to exchangeCodeForToken to trigger the API (which writes to Firestore)
            // This is critical for the PWA Polling method.
        }

        // B. Standard/Popup Execution
        exchangeCodeForToken(code, state);
    }
  }, [location, navigate, showToast]);

  const handleLineLogin = async () => {
    setIsSubmitting(true);
    try {
      if (isLiffBrowser()) {
        liffLogin();
      } else {
        if (!LINE_CHANNEL_ID) throw new Error('LINE Channel ID not configured.');
        
        const state = generateState();
        const nonce = generateNonce();
        localStorage.setItem('line_oauth_state', state);
        
        const redirectUri = window.location.origin + location.pathname;
        const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=profile%20openid%20email&state=${state}&nonce=${nonce}`;

        if (isPwa()) {
            // Setup popup approach for PWA 
            const popup = window.open(authUrl, 'line_login_popup', 'width=500,height=600');
            
            // --- NEW: Firestore Polling Mechanism ---
            const tokenRef = doc(db, 'temp_auth_tokens', state);
            const unsubscribe = onSnapshot(tokenRef, async (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    if (data?.token) {
                        console.log("Received token from Firestore handoff!");
                        await signInWithCustomToken(auth, data.token);
                        
                        // Cleanup
                        unsubscribe();
                        await deleteDoc(tokenRef);
                        localStorage.removeItem('line_oauth_state');
                        if (popup) popup.close();
                        navigate('/', { replace: true });
                    }
                }
            });
            // ----------------------------------------

            // Optional: Timeout checking? If user closes popup without login.
            // For now, simple listener is enough.
        } else {
            // Standard Redirect
            window.location.href = authUrl;
        }
      }
    } catch (error: any) {
      console.error(error);
      showToast('登入初始化失敗', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vh] h-[50vh] bg-[#9F9586]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-[#9F9586]/10 rounded-full blur-3xl"></div>

        {/* Back to Home Button - Top Left */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 z-20 flex items-center space-x-2 text-[#9F9586] hover:text-[#4A4238] transition-colors duration-300 group"
        >
            <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm font-medium tracking-wide">返回首頁</span>
        </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-sm px-6 text-center"
      >
        {/* Logo Area */}
        <div className="mb-12">
             <h1 className="text-4xl font-serif text-[#4A4238] tracking-widest mb-2">TREERING</h1>
             <p className="text-xs text-[#9F9586] tracking-[0.2em] font-medium uppercase">Beauty Salon</p>
        </div>

        {/* Welcome Message */}
        <div className="mb-12 space-y-2">
            
            <p className="text-xs text-gray-500 font-light leading-relaxed">
                預約您的專屬美麗時光<br/>請使用 LINE 帳號登入
            </p>
        </div>

        {/* LINE Login Button */}
        <button 
            onClick={handleLineLogin}
            disabled={isSubmitting}
            className="w-full group relative flex items-center justify-center py-4 px-6 bg-[#06C755] text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-[#05b54c] transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
        >
             {/* Shine Effect */}
             <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-shine"></div>
             
             <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" className="w-6 h-6 mr-3 drop-shadow-sm" />
             <span className="font-bold tracking-wide text-sm">{isSubmitting ? '登入中...' : '使用 LINE 登入'}</span>
        </button>

        {/* Footer info */}
        <div className="mt-12">
            <p className="text-[10px] text-gray-300">
                &copy; {new Date().getFullYear()} Treering Salon. All rights reserved.
            </p>
        </div>

      </motion.div>
    </div>
  );
};


