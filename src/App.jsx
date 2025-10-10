import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminThemeProvider } from './context/AdminThemeContext';

// Public pages
import Home from './pages/Home';
import BuildDetail from './pages/BuildDetail';
import NotFound from './pages/NotFound';

// Admin pages
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import BuildsList from './pages/admin/BuildsList';
import BuildEditor from './pages/admin/BuildEditor';
import ChangePassword from './pages/admin/ChangePassword';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="build/:slug" element={<BuildDetail />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin/login" element={
            <AdminThemeProvider>
              <Login />
            </AdminThemeProvider>
          } />
          <Route
            path="/admin"
            element={
              <AdminThemeProvider>
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              </AdminThemeProvider>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="builds" element={<BuildsList />} />
            <Route path="builds/new" element={<BuildEditor />} />
            <Route path="builds/edit/:id" element={<BuildEditor />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
