import { useState } from 'react';
import { Link } from 'react-router-dom';
import { handleSocialSignIn } from '../lib/socialAuth';

const Register = () => {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialSignInWrapper = async (provider: 'google' | 'line') => {
    setIsSubmitting(true);
    setError(null);
    try {
      await handleSocialSignIn(provider);
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
        <h2 className="text-2xl font-bold text-center text-gray-900">建立帳號</h2>
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="mt-4">
          <button onClick={() => socialSignInWrapper('line')} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#06C755] hover:bg-[#05a546] disabled:opacity-50">
            <img className="h-6 w-6 mr-2" src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE icon" />
            使用 LINE 註冊
          </button>
        </div>

        <p className="text-sm text-center text-gray-600">
          已經有帳號了？{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            點此登入
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
