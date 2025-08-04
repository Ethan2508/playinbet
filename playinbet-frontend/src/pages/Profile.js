import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useKYC } from '../hooks/useKYC';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const { kycStatus, requiresKYC, setShowKYCModal } = useKYC();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // États pour les informations personnelles
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  
  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // États pour les statistiques
  const [stats, setStats] = useState({
    total_duels: 0,
    win_rate: 0,
    current_level: 1,
    xp: 0,
    xp_needed: 100,
    recent_duels: []
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || ''
      });
      
      // Calculer le niveau basé sur les victoires
      const level = Math.floor((user.victories || 0) / 5) + 1;
      const xp = (user.victories || 0) % 5;
      const xpNeeded = 5;
      
      setStats({
        total_duels: user.total_duels || 0,
        win_rate: user.win_rate || 0,
        current_level: level,
        xp: xp,
        xp_needed: xpNeeded,
        recent_duels: []
      });
    }
    fetchRecentDuels();
  }, [user]);

  const fetchRecentDuels = async () => {
    try {
      const response = await api.get('/api/duels/?limit=5');
      const userDuels = response.data.results.filter(
        duel => duel.creator.id === user.id || duel.opponent?.id === user.id
      );
      setStats(prev => ({ ...prev, recent_duels: userDuels }));
    } catch (error) {
      console.error('Erreur lors de la récupération des duels:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('auth/users/me/', profileData);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Erreur lors de la mise à jour' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      return;
    }
    
    setLoading(true);
    try {
      await api.post('auth/users/set_password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.detail || 'Erreur lors du changement de mot de passe' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = () => {
    return (stats.xp / stats.xp_needed) * 100;
  };

  if (!user) {
    return (
      <div className="container-fluid p-4">
        <div className="alert-custom alert-error">
          Vous devez être connecté pour accéder à votre profil.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="profile-container fade-in">
        {/* En-tête du profil */}
        <div className="profile-header">
          <h1>Mon Profil</h1>
          <p>Gérez vos informations personnelles et vos préférences</p>
        </div>
        
        {/* Navigation par onglets */}
        <div className="profile-tabs d-flex">
          <button 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📝 Informations
          </button>
          <button 
            className={`profile-tab ${activeTab === 'kyc' ? 'active' : ''} ${requiresKYC() ? 'tab-warning' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            🆔 Vérification
            {requiresKYC() && (
              <span className="badge bg-danger ms-1 rounded-pill" style={{fontSize: '0.6rem'}}>
                !
              </span>
            )}
          </button>
          <button 
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            🔒 Mot de passe
          </button>
          <button 
            className={`profile-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistiques
          </button>
          <button 
            className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 Historique
          </button>
        </div>
        
        {/* Contenu des onglets */}
        <div className="profile-content">
          {/* Messages */}
          {message.text && (
            <div className={`alert-custom alert-${message.type === 'error' ? 'error' : 'success'}`}>
              {message.text}
            </div>
          )}
          
          {/* Onglet Informations personnelles */}
          {activeTab === 'info' && (
            <div className="fade-in">
              <h5 className="mb-4" style={{color: '#ffffff'}}>Informations personnelles</h5>
              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="row">
                  <div className="col-md-6 profile-form-group">
                    <label className="profile-label">Nom d'utilisateur</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6 profile-form-group">
                    <label className="profile-label">Email</label>
                    <input
                      type="email"
                      className="profile-input"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6 profile-form-group">
                    <label className="profile-label">Prénom</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={profileData.first_name}
                      onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                      placeholder="Optionnel"
                    />
                  </div>
                  <div className="col-md-6 profile-form-group">
                    <label className="profile-label">Nom</label>
                    <input
                      type="text"
                      className="profile-input"
                      value={profileData.last_name}
                      onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                      placeholder="Optionnel"
                    />
                  </div>
                </div>
                
                <div className="stats-grid mt-4">
                  <div className="stat-card">
                    <div className="stat-value" style={{color: '#00bfff'}}>{user.tickets || 0}</div>
                    <div className="stat-label">🎫 Tickets</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{color: '#28a745'}}>{user.victories || 0}</div>
                    <div className="stat-label">🏆 Victoires</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{color: '#ffc107'}}>#{user.rank || 'N/A'}</div>
                    <div className="stat-label">📊 Rang</div>
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="profile-btn mt-4"
                  disabled={loading}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                </button>
              </form>
            </div>
          )}

          {/* Onglet Vérification KYC */}
          {activeTab === 'kyc' && (
            <div className="fade-in">
              <h5 className="mb-4" style={{color: '#ffffff'}}>
                Vérification d'identité (KYC)
              </h5>
              
              {/* Statut de vérification */}
              <div className="mb-4">
                <div className={`alert ${kycStatus?.is_verified ? 'alert-success' : 'alert-warning'}`}>
                  {kycStatus?.is_verified ? (
                    <>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <strong>Compte vérifié !</strong> Vous pouvez accéder à toutes les fonctionnalités.
                    </>
                  ) : (
                    <>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <strong>Vérification requise</strong> - Vous devez compléter votre vérification d'identité pour jouer et retirer des fonds.
                    </>
                  )}
                </div>
              </div>

              {/* Statut détaillé */}
              {kycStatus && (
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-dark border-secondary">
                      <div className="card-body">
                        <h6 className="card-title text-light">Statut de vérification</h6>
                        <p className="card-text">
                          <span className={`badge ${
                            kycStatus.verification_status === 'verified' ? 'bg-success' : 
                            kycStatus.verification_status === 'pending' ? 'bg-warning' : 'bg-danger'
                          }`}>
                            {kycStatus.verification_status_display}
                          </span>
                        </p>
                        {kycStatus.verification_submitted_at && (
                          <small className="text-muted">
                            Soumis le : {new Date(kycStatus.verification_submitted_at).toLocaleDateString('fr-FR')}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-dark border-secondary">
                      <div className="card-body">
                        <h6 className="card-title text-light">Autorisations</h6>
                        <div className="d-flex flex-column gap-2">
                          <span className={`badge ${kycStatus.can_play ? 'bg-success' : 'bg-danger'}`}>
                            {kycStatus.can_play ? '✓' : '✗'} Jouer aux duels
                          </span>
                          <span className={`badge ${kycStatus.can_withdraw ? 'bg-success' : 'bg-danger'}`}>
                            {kycStatus.can_withdraw ? '✓' : '✗'} Retirer des fonds
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="d-flex gap-3">
                {requiresKYC() && (
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowKYCModal(true)}
                  >
                    📋 Compléter la vérification
                  </button>
                )}
                
                {kycStatus?.verification_status === 'pending' && (
                  <button
                    className="btn btn-info"
                    onClick={() => showNotification('Votre dossier est en cours de traitement. Vous recevrez une notification une fois validé.', 'info')}
                  >
                    ⏳ Vérification en cours
                  </button>
                )}
                
                {kycStatus?.is_verified && (
                  <button
                    className="btn btn-success"
                    disabled
                  >
                    ✅ Compte vérifié
                  </button>
                )}
              </div>

              {/* Informations supplémentaires */}
              <div className="mt-4">
                <h6 className="text-light">Pourquoi cette vérification ?</h6>
                <ul className="text-muted small">
                  <li>Sécuriser votre compte et vos transactions</li>
                  <li>Respecter les réglementations financières</li>
                  <li>Lutter contre la fraude et le blanchiment</li>
                  <li>Permettre les retraits de fonds vers votre compte bancaire</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Onglet Mot de passe */}
          {activeTab === 'password' && (
            <div className="fade-in">
              <h5 className="mb-4" style={{color: '#ffffff'}}>Changer le mot de passe</h5>
              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="profile-form-group">
                  <label className="profile-label">Mot de passe actuel</label>
                  <input
                    type="password"
                    className="profile-input"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                    required
                  />
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-label">Nouveau mot de passe</label>
                  <input
                    type="password"
                    className="profile-input"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                    required
                  />
                  <div className="password-strength weak mt-2">
                    Le mot de passe doit contenir au moins 8 caractères.
                  </div>
                </div>
                
                <div className="profile-form-group">
                  <label className="profile-label">Confirmer le nouveau mot de passe</label>
                  <input
                    type="password"
                    className="profile-input"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="profile-btn mt-4"
                  disabled={loading}
                >
                  {loading ? 'Changement...' : 'Changer le mot de passe'}
                </button>
              </form>
            </div>
          )}
          
          {/* Onglet Statistiques */}
          {activeTab === 'stats' && (
            <div className="fade-in">
              <h5 className="mb-4" style={{color: '#ffffff'}}>Statistiques et Niveau</h5>
              
              {/* Carte de niveau */}
              <div className="level-card">
                <div className="row align-items-center">
                  <div className="col-md-3 text-center">
                    <div className="level-number">
                      {stats.current_level}
                    </div>
                    <div style={{color: 'rgba(255, 255, 255, 0.7)'}}>Niveau</div>
                  </div>
                  <div className="col-md-9">
                    <div className="mb-2" style={{color: '#ffffff'}}>
                      <span>Progression vers le niveau {stats.current_level + 1}</span>
                      <span className="float-end">{stats.xp}/{stats.xp_needed} XP</span>
                    </div>
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar-fill" 
                        style={{width: `${getLevelProgress()}%`}}
                      ></div>
                    </div>
                    <small style={{color: 'rgba(255, 255, 255, 0.6)'}}>
                      Gagnez {stats.xp_needed - stats.xp} XP supplémentaires pour passer au niveau supérieur
                    </small>
                  </div>
                </div>
              </div>
              
              {/* Grille de statistiques */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#00bfff'}}>{stats.total_duels}</div>
                  <div className="stat-label">⚔️ Total Duels</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#28a745'}}>{user.victories || 0}</div>
                  <div className="stat-label">🏆 Victoires</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#dc3545'}}>{stats.total_duels - (user.victories || 0)}</div>
                  <div className="stat-label">❌ Défaites</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{color: '#ffc107'}}>{stats.win_rate.toFixed(1)}%</div>
                  <div className="stat-label">📈 Taux de victoire</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Onglet Historique */}
          {activeTab === 'history' && (
            <div className="fade-in">
              <h5 className="mb-4" style={{color: '#ffffff'}}>Historique des duels</h5>
              
              <div className="duel-history">
                {stats.recent_duels.length > 0 ? (
                  stats.recent_duels.map((duel, index) => (
                    <div key={index} className="duel-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 style={{color: '#ffffff', margin: 0}}>
                            Duel #{duel.id}
                          </h6>
                          <small style={{color: 'rgba(255, 255, 255, 0.6)'}}>
                            {duel.creator.username} vs {duel.opponent?.username || 'En attente'}
                          </small>
                        </div>
                        <div className="text-end">
                          <div className={`duel-status ${
                            duel.status === 'completed' ? 
                              (duel.winner?.id === user.id ? 'won' : 'lost') : 
                              duel.status
                          }`}>
                            {duel.status === 'completed' ? 
                              (duel.winner?.id === user.id ? 'Victoire' : 'Défaite') :
                              duel.status === 'open' ? 'Ouvert' :
                              duel.status === 'ongoing' ? 'En cours' : 'En attente'
                            }
                          </div>
                          <small style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                            {new Date(duel.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-5">
                    <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎮</div>
                    <h6 style={{color: 'rgba(255, 255, 255, 0.7)'}}>Aucun duel récent</h6>
                    <p style={{color: 'rgba(255, 255, 255, 0.5)'}}>
                      Commencez à jouer pour voir votre historique ici !
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
