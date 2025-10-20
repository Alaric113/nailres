import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuthStore();

  // Effect to handle navigation after login
  useEffect(() => {
    // If the user is successfully authenticated and we are not in the middle of a submission
    if (currentUser && !isSubmitting) {
      console.log('[Login Effect] User is logged in, navigating to dashboard...');
      const destination = userProfile?.role === 'admin' ? '/admin' : '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [currentUser, userProfile, isSubmitting, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Login Checkpoint 2] Email/Password form submitted.');
    e.preventDefault();
    if (!email || !password) {
      setError('請輸入電子郵件與密碼。');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[Login Checkpoint 3] signInWithEmailAndPassword successful. Waiting for auth state to propagate...');
      // 登入成功後，後續將由 useAuth hook 處理狀態更新與頁面跳轉
      // 這裡不需要再做其他事
    } catch (err: any) {
      // 將 Firebase 的錯誤訊息轉換成更友善的提示
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password': // Note: Firebase new SDKs might use 'auth/invalid-credential'
        case 'auth/invalid-credential':
          setError('電子郵件或密碼無效。');
          break;
        case 'auth/invalid-email':
          setError('請輸入有效的電子郵件地址。');
          break;
        default:
          console.error('[Login Checkpoint 4] Email/Password sign-in error:', err);
          setError('發生預期外的錯誤，請稍後再試。');
          break;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[Login Checkpoint 5] Google Sign-In button clicked.');
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Login Checkpoint 6] signInWithPopup successful. User:', result.user.email);
      const user = result.user;

      // Check if user exists in Firestore, if not, create them (first-time Google login)
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // This case handles users who first sign in via Google on the login page
        console.log('[Login Checkpoint 7] New Google user. Creating Firestore document...');
        await setDoc(userDocRef, {
          email: user.email!,
          profile: {
            displayName: user.displayName || 'New User',
            avatarUrl: user.photoURL || '',
          },
        role: 'user', // New Google users are always 'user' role
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        });
      } else {
        // For existing users, just update their last login time
      // The onAuthStateChanged listener will fetch their actual role.
        console.log('[Login Checkpoint 8] Existing Google user. Updating lastLogin...');
        await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
      }
      // Successful sign-in will be handled by the useAuth hook
    } catch (error: any) {
      console.error('[Login Checkpoint 9] Google Sign-In Error:', error);
      setError('使用 Google 登入失敗，請稍後再試。');
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleLineSignIn = () => {
  //   const lineChannelId = import.meta.env.VITE_LINE_CHANNEL_ID;
  //   if (!lineChannelId) {
  //     setError('LINE 登入設定不完整，請聯繫管理員。');
  //     console.error('VITE_LINE_CHANNEL_ID is not defined in .env.local');
  //     return;
  //   }

  //   const state = Math.random().toString(36).substring(2);
  //   const nonce = Math.random().toString(36).substring(2);
  //   sessionStorage.setItem('line_oauth_state', state); // Store state for verification
  //   sessionStorage.setItem('line_oauth_nonce', nonce); // Store nonce for verification

  //   // 注意：這裡我們將回呼 URL 指向一個新的路由
  //   const redirectUri = `${window.location.origin}/auth/line/callback`;
  //   const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email&nonce=${nonce}`;
  //   window.location.href = lineAuthUrl;
  // };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="absolute top-4 left-4">
          <Link to="/" className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline">
            &larr; 返回首頁
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900 pt-8">
          歡迎回來
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              電子郵件
            </label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密碼</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-3 font-semibold text-white bg-pink-500 rounded-md hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:bg-pink-300 disabled:cursor-not-allowed transition-all">
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">或使用其他方式</span>
          </div>
        </div>

        <div>
          <button onClick={handleGoogleSignIn} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" />
            使用 Google 登入
          </button>
        </div>

        {/* <div className="mt-4">
          <button onClick={handleLineSignIn} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#06C755] hover:bg-[#05a546] disabled:opacity-50">
            <img className="h-6 w-6 mr-2" src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE icon" />
            使用 LINE 登入
          </button>
        </div> */}

        <p className="text-sm text-center text-gray-600">
          還沒有帳號嗎？{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            點此註冊
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;