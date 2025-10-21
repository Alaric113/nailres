import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, lineProvider } from '../lib/firebase';
import type { UserDocument } from '../types/user';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[Register Checkpoint 1] Email/Password registration form submitted.');
    e.preventDefault();
    if (password.length < 6) {
      setError('密碼長度至少需 6 個字元。');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[Register Checkpoint 2] createUserWithEmailAndPassword successful. User:', userCredential.user.email);
      const user = userCredential.user;

      // 2. Create a corresponding user document in Firestore
      console.log('[Register Checkpoint 3] Creating Firestore document for new user...');
      const userDocRef = doc(db, 'users', user.uid);
      const newUserDocument: UserDocument = {
        email: user.email!,
        profile: {
          displayName: displayName,
        },
        role: 'user', // All new users default to 'user' role
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserDocument);
      console.log('[Register Checkpoint 4] Firestore document created. Waiting for onAuthStateChanged...');

      // Successful registration will trigger onAuthStateChanged,
      // and the useAuth hook will handle the redirect.
    } catch (err: any) {
      console.error('[Register Checkpoint 5] Registration failed:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('此電子郵件已被註冊。');
      } else {
        setError('建立帳號失敗，請稍後再試。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('[Register Checkpoint 6] Google Sign-In button clicked.');
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[Register Checkpoint 7] signInWithPopup successful. User:', result.user.email);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      console.log('[Register Checkpoint 8] Checking if user exists in Firestore...');
      if (!userDocSnap.exists()) {
        const newUserDocument: UserDocument = {
          email: user.email!,
          profile: {
            displayName: user.displayName || 'New User',
            avatarUrl: user.photoURL || '',
          },
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };
        await setDoc(userDocRef, newUserDocument);
        console.log('[Register Checkpoint 9] New Google user. Firestore document created.');
      } else {
        await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
        console.log('[Register Checkpoint 10] Existing Google user. lastLogin updated.');
      }
    } catch (error: any) {
      console.error('[Register Checkpoint 11] Google Sign-In Error:', error);
      setError('使用 Google 登入失敗，請稍後再試。');
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLineSignIn = async () => {
    console.log('[Register Checkpoint] LINE Sign-In button clicked.');
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, lineProvider);
      console.log('[Register Checkpoint] LINE signInWithPopup successful. User:', result.user.displayName);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Find the LINE provider data to get the LINE-specific user ID
        const lineProviderData = user.providerData.find(p => p.providerId === 'oidc.line');

        const newUserDocument: UserDocument = {
          email: user.email || `line-${user.uid}@placeholder.com`, // LINE may not provide email
          profile: {
            displayName: user.displayName || 'LINE User',
            avatarUrl: user.photoURL || '',
          },
          role: 'user',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          lineUserId: lineProviderData?.uid, // Save the LINE User ID
        };
        await setDoc(userDocRef, newUserDocument);
        console.log('[Register Checkpoint] New LINE user. Firestore document created.');
      }
    } catch (error: any) {
      console.error('[Register Checkpoint] LINE Sign-In Error:', error);
      setError('使用 LINE 登入失敗，請稍後再試。');
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
            <label htmlFor="displayName" className="text-sm font-medium text-gray-700">名稱</label>
            <input id="displayName" name="displayName" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
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
              {isSubmitting ? '建立中...' : '註冊'}
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
            使用 Google 註冊
          </button>
        </div>

        <div className="mt-4">
          <button onClick={handleLineSignIn} disabled={isSubmitting} className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#06C755] hover:bg-[#05a546] disabled:opacity-50">
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
