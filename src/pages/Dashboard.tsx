import { auth } from '../services/firebase';
import { useAuthStore } from '../store/authStore';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard!</h1>
      <p className="mt-2">You are logged in as: {user?.email}</p>
      <button onClick={handleLogout} className="px-4 py-2 mt-4 font-bold text-white bg-red-500 rounded hover:bg-red-700">Logout</button>
    </div>
  );
};

export default Dashboard;