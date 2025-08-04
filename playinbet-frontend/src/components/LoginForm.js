import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const LoginForm = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        addNotification('Connexion réussie ! Bienvenue sur PlayInBet 🎮', 'success');
        onClose();
      } else {
        addNotification(result.error || 'Erreur de connexion', 'error');
      }
    } catch (error) {
      addNotification('Une erreur est survenue lors de la connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <div className="mb-3">
        <label htmlFor="username" className="form-label text-white">
          👤 Nom d'utilisateur
        </label>
        <input
          type="text"
          id="username"
          className="form-control form-control-custom"
          placeholder="Entrez votre nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="form-label text-white">
          🔒 Mot de passe
        </label>
        <input
          type="password"
          id="password"
          className="form-control form-control-custom"
          placeholder="Entrez votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="d-grid gap-2">
        <button
          type="submit"
          className="btn btn-primary-custom"
          disabled={loading || !username || !password}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              Connexion...
            </>
          ) : (
            '🚀 Se connecter'
          )}
        </button>
        
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onClose}
          disabled={loading}
        >
          Annuler
        </button>
      </div>

      <div className="text-center mt-3">
        <small className="text-muted">
          Pas encore de compte ? Inscrivez-vous pour commencer à jouer !
        </small>
      </div>
    </form>
  );
};

export default LoginForm;