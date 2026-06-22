import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { Shell } from './components/Shell.jsx';
import { Loader } from './components/Ui.jsx';
import Admin from './pages/Admin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NewsFeed from './pages/NewsFeed.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import Trends from './pages/Trends.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Shell /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="feed" element={<NewsFeed />} />
          <Route path="trends" element={<Trends />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
