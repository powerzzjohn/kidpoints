import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { api } from './lib/api';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildDashboard from './pages/child/ChildDashboard';
import PointsHistory from './pages/child/PointsHistory';
import PointsManagement from './pages/parent/PointsManagement';
import RulesManagement from './pages/parent/RulesManagement';
import RulesConfirmation from './pages/child/RulesConfirmation';
import ShopManagement from './pages/parent/ShopManagement';
import Shop from './pages/child/Shop';
import Redemptions from './pages/child/Redemptions';
import RedemptionApproval from './pages/parent/RedemptionApproval';
import BadgeManagement from './pages/parent/BadgeManagement';
import BadgeCollection from './pages/child/BadgeCollection';
import ThemeTest from './pages/ThemeTest';
import Leaderboard from './pages/Leaderboard';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationDisplay from './components/NotificationDisplay';

function App() {
  const { setAuth, isAuthenticated, user } = useAuthStore();

  // 在应用启动时检查是否有有效的 token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      // 尝试获取用户信息
      api.get('/api/auth/profile')
        .then((response) => {
          setAuth(response.data, token);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, [setAuth, user]);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 登录页面 */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? (
                <Navigate to={user?.role === 'PARENT' ? '/parent/dashboard' : '/child/dashboard'} replace />
              ) : (
                <LoginPage />
              )
            } 
          />

          {/* 家长路由 */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/points"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <PointsManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/rules"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <RulesManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/shop"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <ShopManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/redemptions"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <RedemptionApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/badges"
            element={
              <ProtectedRoute requiredRole="PARENT">
                <BadgeManagement />
              </ProtectedRoute>
            }
          />

          {/* 儿童路由 */}
          <Route
            path="/child/dashboard"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <ChildDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/child/points-history"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <PointsHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/child/rules"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <RulesConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/child/shop"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <Shop />
              </ProtectedRoute>
            }
          />
          <Route
            path="/child/redemptions"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <Redemptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/child/badges"
            element={
              <ProtectedRoute requiredRole="CHILD">
                <BadgeCollection />
              </ProtectedRoute>
            }
          />

          {/* 通知功能测试页面 */}
          <Route
            path="/test-notifications"
            element={
              <ProtectedRoute>
                <ThemeTest />
              </ProtectedRoute>
            }
          />

          {/* 排行榜页面 */}
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* 默认路由 */}
          <Route 
            path="/" 
            element={
              isAuthenticated() ? (
                <Navigate to={user?.role === 'PARENT' ? '/parent/dashboard' : '/child/dashboard'} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />

          {/* 404 页面 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* 全局通知显示 */}
        {isAuthenticated() && <NotificationDisplay />}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
