import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleSocialSignIn } from '../lib/socialAuth';
import type { UserDocument } from '../types/user';

const Register = () => {
  console.log("Rendering Register component");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // Create user document in Firestore
      const newUserProfile: UserDocument = {
        email: user.email || '',
        profile: {
          displayName: name,
          avatarUrl: '',
        },
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), newUserProfile);
      
    } catch (err: any) {
      console.error('Registration Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('此電子郵件已被註冊。');
      } else if (err.code === 'auth/weak-password') {
        setError('密碼強度不足，請使用更強的密碼。');
      } else {
        setError('註冊失敗，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialSignInWrapper = async (provider: 'google' | 'line') => {
    setIsSubmitting(true);
    setError(null);
    try {
      await handleSocialSignIn(provider);
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
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-gray-700">姓名</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">電子郵件</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密碼</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-none focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
            />
          </div>
          
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button type="submit" disabled={isSubmitting} className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed">
              {isSubmitting ? '註冊中...' : '註冊'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">或使用其他方式</span></div>
        </div>

        <div className="space-y-3">
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