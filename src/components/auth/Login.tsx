import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../context/ToastContext'; // NEW IMPORT
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { handleSocialSignIn } from '../../lib/socialAuth';
import { isLiffBrowser, liffLogin } from '../../lib/liff';
import { generateNonce, generateState } from '../../utils/lineAuth';

const LINE_CHANNEL_ID = import.meta.env.VITE_LINE_CHANNEL_ID;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const isOAuthProcessing = useRef(false); // Flag to prevent double processing in Strict Mode

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');

    const handleLineOAuthRedirect = async () => {
      // Only proceed if code and state are present AND we haven't processed it yet
      if (code && state && !isOAuthProcessing.current) {
        isOAuthProcessing.current = true; // Set flag to true

        setIsSubmitting(true);
        setError(null);
        console.log('LINE OAuth Redirect Handler: Received code and state.');

        try {
          // Verify state to prevent CSRF
          const storedState = localStorage.getItem('line_oauth_state');
          console.log('LINE OAuth Redirect Handler: Stored State:', storedState);
          console.log('LINE OAuth Redirect Handler: Received State:', state);
          
          if (!storedState || storedState !== state) {
            throw new Error('State mismatch. Possible CSRF attack.');
          }
          // DO NOT remove from localStorage yet. Remove AFTER successful Firebase login.
          
          // Exchange authorization code for Firebase custom token
          const redirectUri = window.location.origin + location.pathname; // Current page URL
          console.log('Frontend sending OAuth code to Netlify function:', JSON.stringify({ code, redirectUri }));
          const response = await fetch('/api/line-oauth-auth', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirectUri }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get Firebase custom token from OAuth.');
          }

          const { firebaseCustomToken } = await response.json();
          await signInWithCustomToken(auth, firebaseCustomToken);
          
          localStorage.removeItem('line_oauth_state'); // Now it's safe to remove
          console.log('Successfully signed in with LINE OAuth via Firebase custom token.');

          // Clean up URL
          navigate(location.pathname, { replace: true });

        } catch (err: any) {
          console.error('Error during LINE OAuth redirect handling:', err);
          showToast(`LINE 登入失敗：${err.message || '請稍後再試。'}`, 'error');
          // Clean up URL even on error
          navigate(location.pathname, { replace: true });
          localStorage.removeItem('line_oauth_state'); // Also remove on error
        } finally {
          setIsSubmitting(false);
          isOAuthProcessing.current = false; // Reset flag
        }
      } else if (code && !state) {
        // If code is present but state is missing, it's an invalid or expired redirect
        console.warn('LINE OAuth Redirect Handler: Code present but state missing or processing already occurred.');
        navigate(location.pathname, { replace: true }); // Clean up URL
      }
    };

    handleLineOAuthRedirect();
  }, [location, navigate]); // Depend on location to re-run when params change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Successful login will trigger onAuthStateChanged,
      // and the useAuth hook will handle the redirect.
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('電子郵件或密碼錯誤。');
      } else {
        setError('登入失敗，請稍後再試。');
      }
      console.error('Login Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialSignInWrapper = async (provider: 'google' | 'line') => {
    setIsSubmitting(true);
    setError(null); // Clear local error state
    try {
      if (provider === 'line') {
        if (isLiffBrowser()) {
          // Use LIFF flow if in LIFF browser context
          liffLogin();
        } else {
          // Use LINE OAuth 2.0 (Authorization Code Flow) for regular browser
          if (!LINE_CHANNEL_ID) {
            throw new Error('LINE Channel ID is not configured.');
          }
          const state = generateState();
          const nonce = generateNonce();
          localStorage.setItem('line_oauth_state', state); // Store state to verify on redirect

          const redirectUri = window.location.origin + location.pathname; // Current page URL

          const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?` +
            `response_type=code` +
            `&client_id=${LINE_CHANNEL_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=profile%20openid%20email` + // Request profile, openid, and email
            `&state=${state}` +
            `&nonce=${nonce}`;
          
          window.location.href = lineAuthUrl; // Redirect to LINE login page
        }
      } else {
        // Use standard Firebase Auth for Google
        await handleSocialSignIn(provider);
        showToast(`使用 ${provider === 'google' ? 'Google' : 'LINE'} 登入成功！`, 'success');
      }
    } catch (error: any) {
      console.error(`Social Sign-In Error (${provider}):`, error);
      showToast(`使用 ${provider === 'google' ? 'Google' : 'LINE'} 登入失敗：${error.message || '請稍後再試。'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">登入您的帳號</h2>
        <form className="space-y-6 hidden" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">電子郵件</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密碼</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6 hidden">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用其他方式</span></div>
        </div>

        <div className='hidden'>
          <button onClick={() => socialSignInWrapper('google')} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" />
            使用 Google 登入
          </button>
        </div>

        <div className="mt-4">
          <button onClick={() => socialSignInWrapper('line')} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#06C755] hover:bg-[#05a546] disabled:opacity-50">
            <img className="h-6 w-6 mr-2" src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE icon" />
            使用 LINE 登入
          </button>
        </div>

        <p className="text-sm text-center text-gray-600">
          還沒有帳號？{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            點此註冊
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
