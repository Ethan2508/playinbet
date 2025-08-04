import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { KYCProvider } from './hooks/useKYC';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/Sidebar';
import DuelRedirectWrapper from './components/DuelRedirectWrapper';
import KYCVerificationModal from './components/KYCVerificationModal';
import { useKYC } from './hooks/useKYC';
import Home from './pages/Home';
import Matches from './pages/Matches';
import DuelRoom from './pages/DuelRoom';
import Leaderboard from './pages/Leaderboard';
import Tournaments from './pages/Tournaments';
import Shop from './pages/Shop';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
// Pages Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDuels from './pages/admin/AdminDuels';
import AdminConflicts from './pages/admin/AdminConflicts';
import AdminSettings from './pages/admin/AdminSettings';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function AppContent() {
  const { showKYCModal, handleKYCSuccess, handleKYCClose } = useKYC();

  return (
    <Router>
      <DuelRedirectWrapper>
        <div className="d-flex min-vh-100">
          <Sidebar />
          <main className="flex-grow-1 p-4" style={{ 
            backgroundColor: 'rgba(0,0,0,0.1)',
            marginLeft: '280px',
            overflowY: 'auto',
            height: '100vh' // Hauteur pleine maintenant sans header
          }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/matches" element={
                <ProtectedRoute>
                  <Matches />
                </ProtectedRoute>
              } />
              <Route path="/duel/:duelId" element={
                <ProtectedRoute>
                  <DuelRoom />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/tournaments" element={
                <ProtectedRoute>
                  <Tournaments />
                </ProtectedRoute>
              } />
              <Route path="/shop" element={
                <ProtectedRoute>
                  <Shop />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              {/* Routes Admin */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              <Route path="/admin/duels" element={
                <AdminRoute>
                  <AdminDuels />
                </AdminRoute>
              } />
              <Route path="/admin/conflicts" element={
                <AdminRoute>
                  <AdminConflicts />
                </AdminRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              } />
            </Routes>
          </main>
        </div>
        
        {/* Modal KYC */}
        <KYCVerificationModal
          isOpen={showKYCModal}
          onClose={handleKYCClose}
          onSuccess={handleKYCSuccess}
        />
      </DuelRedirectWrapper>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <KYCProvider>
          <AppContent />
        </KYCProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;