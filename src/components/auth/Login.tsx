import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider, lineProvider } from '../../lib/firebase';
import { handleSocialSignIn } from '../../lib/socialAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setError(null);
    try {
      const authProvider = provider === 'google' ? googleProvider : lineProvider;
      await handleSocialSignIn(authProvider);
      // On success, onAuthStateChanged will handle the redirect.
      // On redirect, the page will reload and onAuthStateChanged will handle it.
    } catch (error: any) {
      console.error(`Social Sign-In Error (${provider}):`, error);
      setError(`使用 ${provider === 'google' ? 'Google' : 'LINE'} 登入失敗，請稍後再試。`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        {/* --- DEBUG INFO --- */}
        <div className="p-2 text-xs text-gray-500 bg-gray-100 rounded break-all">
          <strong>User Agent:</strong> {navigator.userAgent}
        </div>
        {/* --- END DEBUG INFO --- */}

        <h2 className="text-2xl font-bold text-center text-gray-900">登入您的帳號</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">電子郵件</label>
            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密碼</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用其他方式</span></div>
        </div>

        <div>
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