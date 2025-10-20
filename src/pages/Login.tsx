import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard'); // 登入成功後導向儀表板
    } catch (err: any) {
      setError('登入失敗，請檢查您的信箱和密碼。');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold text-center">登入您的帳號</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="電子信箱" required className="w-full px-4 py-2 border rounded-md" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密碼" required className="w-full px-4 py-2 border rounded-md" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full px-4 py-2 font-bold text-white bg-pink-500 rounded-md hover:bg-pink-600">登入</button>
        </form>
        <div className="text-center text-gray-600">
          <p>還沒有帳號嗎？
            <Link to="/register" className="ml-2 font-semibold text-pink-500 hover:underline">
              立即註冊
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;