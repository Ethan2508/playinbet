import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useKYC } from '../hooks/useKYC';
import { useNotification } from '../context/NotificationContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const Sidebar = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const { kycStatus, requiresKYC, setShowKYCModal } = useKYC();
  const { showNotification } = useNotification();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [hasShownKYCNotification, setHasShownKYCNotification] = useState(false);

  // Afficher une notification pour la vérification KYC
  useEffect(() => {
    if (isAuthenticated && requiresKYC() && !hasShownKYCNotification) {
      showNotification(
        'Votre compte nécessite une vérification. Veuillez compléter vos informations KYC.',
        'warning',
        8000
      );
      setHasShownKYCNotification(true);
    }
  }, [isAuthenticated, requiresKYC, hasShownKYCNotification, showNotification]);

  const handleLogout = async () => {
    await logout();
    setHasShownKYCNotification(false);
  };

  const handleKYCClick = () => {
    setShowKYCModal(true);
  };

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Accueil', public: true },
    { path: '/matches', icon: '🎮', label: 'Duels', public: false },
    { path: '/leaderboard', icon: '🏆', label: 'Classement', public: false },
    { path: '/tournaments', icon: '🎯', label: 'Tournois', public: false },
    { path: '/shop', icon: '🛒', label: 'Shop', public: false },
    { path: '/wallet', icon: '💼', label: 'Portefeuille', public: false },
    { path: '/profile', icon: '👤', label: 'Mon Profil', public: false },
  ];

  const adminMenuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard', admin: true },
    { path: '/admin/users', icon: '👥', label: 'Utilisateurs', admin: true },
    { path: '/admin/duels', icon: '⚔️', label: 'Duels', admin: true },
    { path: '/admin/conflicts', icon: '⚖️', label: 'Conflits', admin: true },
    { path: '/admin/settings', icon: '⚙️', label: 'Paramètres', admin: true },
  ];

  const isUserAdmin = user?.is_admin === true;
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div 
        className="bg-dark text-white d-flex flex-column"
        style={{
          width: '280px',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          backgroundColor: 'rgba(33, 37, 41, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff!important',
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        <div className="flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="p-4">
            <div className="d-flex align-items-center mb-4 pb-3" style={{borderBottom: '1px solid rgba(255, 255, 255, 0.1)'}}>
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3" style={{width: '48px', height: '48px'}}>
                <span className="fw-bold text-white">🎮</span>
              </div>
              <div>
                <h5 className="mb-1 fw-bold text-primary">PlayInBet</h5>
                <small className="text-primary" style={{opacity: 0.8}}>Plateforme de duels</small>
              </div>
            </div>


            {/* Boutons d'authentification pour les non-connectés */}
            {!isAuthenticated && (
              <div className="mb-4">
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-outline-light"
                    onClick={() => setShowLogin(true)}
                  >
                    🔑 Se connecter
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowRegister(true)}
                  >
                    ✨ S'inscrire
                  </button>
                </div>
              </div>
            )}

            {/* Menu principal */}
            {menuItems.map((item) => {
              if (item.public || isAuthenticated) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link d-flex align-items-center py-3 px-4 mb-2 rounded text-decoration-none transition-all ${
                      isActive(item.path)
                        ? 'bg-primary text-white'
                        : 'text-light hover-bg-primary-subtle'
                    }`}
                    style={{
                      transition: 'all 0.3s ease',
                      backgroundColor: isActive(item.path) ? 'var(--bs-primary)' : 'transparent',
                      borderLeft: isActive(item.path) ? '4px solid var(--bs-warning)' : '4px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span className="me-3" style={{ fontSize: '1.2rem' }}>
                      {item.icon}
                    </span>
                    <span className="fw-500 flex-grow-1">{item.label}</span>
                    {/* Badge KYC pour Mon Profil */}
                    {item.path === '/profile' && requiresKYC() && (
                      <span 
                        className="badge bg-danger rounded-pill ms-2" 
                        style={{fontSize: '0.6rem', minWidth: '16px', height: '16px'}}
                        title="Vérification requise"
                      >
                        !
                      </span>
                    )}
                  </Link>
                );
              } else {
                return (
                  <div
                    key={item.path}
                    className="nav-link text-muted d-flex align-items-center py-3 px-4"
                    style={{
                      cursor: 'not-allowed',
                      borderLeft: '4px solid transparent',
                      backgroundColor: 'rgba(108, 117, 125, 0.1)',
                      color: '#ffffff',
                    }}
                    title="Connexion requise pour accéder à cette page"
                  >
                    <span className="me-3" style={{ fontSize: '1.2rem', opacity: '0.5' }}>
                      {item.icon}
                    </span>
                    <span className="fw-500" style={{ opacity: '0.5' }}>{item.label}</span>
                  </div>
                );
              }
            })}

            {/* Séparateur pour la section admin */}
            {isUserAdmin && isAuthenticated && (
              <div className="my-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="flex-grow-1" style={{height: '1px', backgroundColor: 'rgba(255, 193, 7, 0.3)'}}></div>
                  <span className="mx-3 text-warning fw-bold" style={{fontSize: '0.85rem'}}>ADMINISTRATION</span>
                  <div className="flex-grow-1" style={{height: '1px', backgroundColor: 'rgba(255, 193, 7, 0.3)'}}></div>
                </div>
              </div>
            )}

            {/* Menu admin */}
            {isUserAdmin && isAuthenticated && adminMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link d-flex align-items-center py-3 px-3 mb-2 rounded text-decoration-none transition-all ${
                  isActive(item.path)
                    ? 'bg-warning text-dark'
                    : 'text-warning hover-bg-warning-subtle'
                }`}
                style={{
                  transition: 'all 0.3s ease',
                  backgroundColor: isActive(item.path) ? 'var(--bs-warning)' : 'transparent',
                  border: '1px solid rgba(255, 193, 7, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="me-3" style={{ fontSize: '1.2rem' }}>
                  {item.icon}
                </span>
                <span className="fw-500">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Section utilisateur en bas - fixe */}
        {isAuthenticated && user && (
          <div 
            className="p-4" 
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(33, 37, 41, 0.98)',
              flexShrink: 0
            }}
          >
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle bg-success d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                <span className="fw-bold text-white">{user.username?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold text-light d-flex align-items-center">
                  {user.username}
                  {requiresKYC() && (
                    <span 
                      className="badge bg-danger ms-2 rounded-pill" 
                      style={{fontSize: '0.6rem', minWidth: '18px', height: '18px'}}
                      title="Vérification requise"
                    >
                      !
                    </span>
                  )}
                </div>
                <div className="text-muted small">{user.tickets || 0} tickets</div>
                {kycStatus?.is_verified && (
                  <div className="badge bg-success text-white mt-1" style={{fontSize: '0.7rem'}}>
                    ✓ Vérifié
                  </div>
                )}
                {isUserAdmin && (
                  <div className="badge bg-warning text-dark mt-1" style={{fontSize: '0.7rem'}}>
                    AdminDuels
                  </div>
                )}
              </div>
            </div>
            
            {/* Bouton de vérification KYC si nécessaire */}
            {requiresKYC() && (
              <div className="mb-3">
                <button
                  className="btn btn-warning btn-sm w-100 mb-2"
                  onClick={handleKYCClick}
                  style={{fontSize: '0.8rem'}}
                >
                  📋 Valider le profil
                </button>
                <div className="text-warning small text-center">
                  Vérification requise pour jouer
                </div>
              </div>
            )}
            
            <div className="d-grid">
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                🚪 Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals pour connexion et inscription */}
      {showLogin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-white">Connexion</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLogin(false)}
                ></button>
              </div>
              <div className="modal-body">
                <LoginForm onClose={() => setShowLogin(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegister && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-white">Inscription</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRegister(false)}
                ></button>
              </div>
              <div className="modal-body">
                <RegisterForm onClose={() => setShowRegister(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
