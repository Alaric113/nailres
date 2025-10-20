import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Page Components
import Home from './pages/Home';
import Login from './pages/Login';
// import Register from './Register';
// import Dashboard from './Dashboard';
// import BookingPage from './BookingPage';
import AdminDashboard from './pages/AdminDashboard';

// Route Components
// import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  // This hook will run on app startup and handle auth state synchronization.
  useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected Routes for regular users */}
        {/* <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/booking" element={<BookingPage />} />
        </Route> */}

        {/* Protected Routes for admins */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;