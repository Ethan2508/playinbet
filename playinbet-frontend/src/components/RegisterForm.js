import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const RegisterForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { addNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addNotification('Les mots de passe ne correspondent pas', 'error');
      return;
    }

    if (formData.password.length < 6) {
      addNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await register(formData.username, formData.email, formData.password);
      
      if (result.success) {
        addNotification('Inscription réussie ! Vous pouvez maintenant vous connecter 🎉', 'success');
        onClose();
      } else {
        const errorMessage = typeof result.error === 'object' 
          ? Object.values(result.error).flat().join(', ')
          : result.error;
        addNotification(errorMessage || 'Erreur lors de l\'inscription', 'error');
      }
    } catch (error) {
      addNotification('Une erreur est survenue lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.username && formData.email && formData.password && formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="p-2">
      <div className="mb-3">
        <label htmlFor="username" className="form-label text-white">
          👤 Nom d'utilisateur
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className="form-control form-control-custom"
          placeholder="Choisissez un nom d'utilisateur"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="email" className="form-label text-white">
          📧 Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-control form-control-custom"
          placeholder="votre.email@exemple.com"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label text-white">
          🔒 Mot de passe
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-control form-control-custom"
          placeholder="Minimum 6 caractères"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          minLength={6}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="confirmPassword" className="form-label text-white">
          🔐 Confirmer le mot de passe
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          className="form-control form-control-custom"
          placeholder="Répétez votre mot de passe"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>

      <div className="d-grid gap-2">
        <button
          type="submit"
          className="btn btn-primary-custom"
          disabled={loading || !isFormValid}
        >
          {loading ? (
            <>
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              Inscription...
            </>
          ) : (
            '✨ S\'inscrire'
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
          En vous inscrivant, vous recevez 100 tickets gratuits pour commencer !
        </small>
      </div>
    </form>
  );
};

export default RegisterForm;