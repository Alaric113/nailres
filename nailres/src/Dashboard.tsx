import { auth } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="max-w-4xl p-8 mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button onClick={handleLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
      </div>
      <p className="mt-2 text-gray-600">Welcome back, {user?.email}!</p>
      <div className="mt-8">
        <Link to="/booking" className="inline-block px-6 py-3 mr-4 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Make a New Booking
        </Link>
        <Link to="/history" className="inline-block px-6 py-3 font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          View My Bookings
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;