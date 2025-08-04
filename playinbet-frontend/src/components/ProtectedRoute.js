import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginForm from './LoginForm';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Chargement...</span>
          </div>
          <h5 className="text-white">Vérification de l'authentification...</h5>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, afficher le formulaire de connexion
  if (!user) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="glass-card">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-lock fa-3x text-primary mb-3"></i>
                  <h3 className="text-white fw-bold">Accès Restreint</h3>
                  <p className="text-light opacity-75 mb-4">
                    Vous devez être connecté pour accéder à cette page.
                  </p>
                </div>
                <LoginForm />
                <div className="text-center mt-4">
                  <p className="text-light opacity-75 mb-0">
                    Pas encore de compte ? 
                    <button 
                      className="btn btn-link text-primary p-0 ms-1"
                      onClick={() => {
                        // Cette logique sera gérée par le composant parent
                        console.log('Redirection vers inscription');
                      }}
                    >
                      Créez-en un maintenant !
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher le contenu protégé
  return children;
};

export default ProtectedRoute;
