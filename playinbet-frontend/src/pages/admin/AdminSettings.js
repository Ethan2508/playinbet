import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platform: {
      name: 'PlayInBet',
      description: 'Plateforme de duels gaming compétitifs',
      maintenance_mode: false,
      registration_enabled: true,
      min_bet_amount: 10,
      max_bet_amount: 5000,
      platform_commission: 5,
      max_active_duels_per_user: 10
    },
    security: {
      require_email_verification: true,
      require_phone_verification: false,
      enable_two_factor: false,
      auto_suspend_disputes: 3,
      max_login_attempts: 5,
      session_timeout: 3600
    },
    games: {
      supported_games: ['Match amical foot', 'Build Fight', '1V1 Sniper', 'Combat rapide', 'Zone Wars', 'Défi Aim', 'Course aérienne', 'Freestyle', 'Clutch 1v1', 'Quick Scope'],
      allow_custom_games: false,
      default_match_duration: 30,
      auto_resolve_timeout: 1440
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      admin_alerts: true,
      dispute_notifications: true
    }
  });

  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // En production, récupérer les paramètres depuis l'API
      // const response = await api.get('/admin/settings/');
      // setSettings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // En production, sauvegarder via l'API
      // await api.put('/admin/settings/', settings);
      
      setSavedMessage('Paramètres sauvegardés avec succès !');
      setTimeout(() => setSavedMessage(''), 3000);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setLoading(false);
    }
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const TabButton = ({ id, label, icon, active, onClick }) => (
    <button
      className={`nav-link ${active ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      <i className={`${icon} me-2`}></i>
      {label}
    </button>
  );

  const SettingItem = ({ label, description, children, required = false }) => (
    <div className="row mb-4 align-items-center">
      <div className="col-md-4">
        <label className="form-label mb-0">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
        {description && <small className="text-muted d-block">{description}</small>}
      </div>
      <div className="col-md-8">
        {children}
      </div>
    </div>
  );

  const renderPlatformSettings = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-cog me-2"></i>
          Paramètres de la Plateforme
        </h5>
      </div>
      <div className="card-body">
        <SettingItem 
          label="Nom de la plateforme" 
          description="Nom affiché publiquement"
          required
        >
          <input
            type="text"
            className="form-control"
            value={settings.platform.name}
            onChange={(e) => handleSettingChange('platform', 'name', e.target.value)}
          />
        </SettingItem>

        <SettingItem 
          label="Description" 
          description="Description courte de la plateforme"
        >
          <textarea
            className="form-control"
            rows="3"
            value={settings.platform.description}
            onChange={(e) => handleSettingChange('platform', 'description', e.target.value)}
          />
        </SettingItem>

        <SettingItem 
          label="Mode maintenance" 
          description="Désactive temporairement la plateforme"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.platform.maintenance_mode}
              onChange={(e) => handleSettingChange('platform', 'maintenance_mode', e.target.checked)}
            />
            <label className="form-check-label">
              {settings.platform.maintenance_mode ? 'Activé' : 'Désactivé'}
            </label>
          </div>
        </SettingItem>

        <SettingItem 
          label="Inscriptions" 
          description="Autoriser les nouvelles inscriptions"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.platform.registration_enabled}
              onChange={(e) => handleSettingChange('platform', 'registration_enabled', e.target.checked)}
            />
            <label className="form-check-label">
              {settings.platform.registration_enabled ? 'Autorisées' : 'Désactivées'}
            </label>
          </div>
        </SettingItem>

        <SettingItem 
          label="Mise minimum" 
          description="Montant minimum pour un duel (€)"
          required
        >
          <input
            type="number"
            className="form-control"
            min="1"
            value={settings.platform.min_bet_amount}
            onChange={(e) => handleSettingChange('platform', 'min_bet_amount', parseInt(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Mise maximum" 
          description="Montant maximum pour un duel (€)"
          required
        >
          <input
            type="number"
            className="form-control"
            min="1"
            value={settings.platform.max_bet_amount}
            onChange={(e) => handleSettingChange('platform', 'max_bet_amount', parseInt(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Commission plateforme" 
          description="Pourcentage prélevé sur chaque duel (%)"
          required
        >
          <input
            type="number"
            className="form-control"
            min="0"
            max="50"
            step="0.1"
            value={settings.platform.platform_commission}
            onChange={(e) => handleSettingChange('platform', 'platform_commission', parseFloat(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Duels simultanés max" 
          description="Nombre maximum de duels actifs par utilisateur"
        >
          <input
            type="number"
            className="form-control"
            min="1"
            max="50"
            value={settings.platform.max_active_duels_per_user}
            onChange={(e) => handleSettingChange('platform', 'max_active_duels_per_user', parseInt(e.target.value))}
          />
        </SettingItem>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-shield-alt me-2"></i>
          Paramètres de Sécurité
        </h5>
      </div>
      <div className="card-body">
        <SettingItem 
          label="Vérification email" 
          description="Exiger la vérification d'email lors de l'inscription"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.security.require_email_verification}
              onChange={(e) => handleSettingChange('security', 'require_email_verification', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Vérification téléphone" 
          description="Exiger la vérification du numéro de téléphone"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.security.require_phone_verification}
              onChange={(e) => handleSettingChange('security', 'require_phone_verification', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Authentification à deux facteurs" 
          description="Activer 2FA pour tous les utilisateurs"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.security.enable_two_factor}
              onChange={(e) => handleSettingChange('security', 'enable_two_factor', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Suspension automatique" 
          description="Nombre de conflits avant suspension automatique"
        >
          <input
            type="number"
            className="form-control"
            min="1"
            max="10"
            value={settings.security.auto_suspend_disputes}
            onChange={(e) => handleSettingChange('security', 'auto_suspend_disputes', parseInt(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Tentatives de connexion max" 
          description="Nombre d'échecs avant blocage temporaire"
        >
          <input
            type="number"
            className="form-control"
            min="3"
            max="10"
            value={settings.security.max_login_attempts}
            onChange={(e) => handleSettingChange('security', 'max_login_attempts', parseInt(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Timeout de session" 
          description="Durée d'inactivité avant déconnexion (secondes)"
        >
          <select
            className="form-select"
            value={settings.security.session_timeout}
            onChange={(e) => handleSettingChange('security', 'session_timeout', parseInt(e.target.value))}
          >
            <option value="1800">30 minutes</option>
            <option value="3600">1 heure</option>
            <option value="7200">2 heures</option>
            <option value="14400">4 heures</option>
            <option value="28800">8 heures</option>
          </select>
        </SettingItem>
      </div>
    </div>
  );

  const renderGamesSettings = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-gamepad me-2"></i>
          Paramètres des Jeux
        </h5>
      </div>
      <div className="card-body">
        <SettingItem 
          label="Jeux supportés" 
          description="Liste des jeux disponibles pour les duels"
        >
          <div className="d-flex flex-wrap gap-2">
            {settings.games.supported_games.map(game => (
              <span key={game} className="badge bg-primary px-3 py-2">
                {game}
                <button 
                  className="btn btn-sm ms-2 p-0 text-white"
                  style={{ border: 'none', background: 'none' }}
                  onClick={() => {
                    const newGames = settings.games.supported_games.filter(g => g !== game);
                    handleSettingChange('games', 'supported_games', newGames);
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="input-group mt-2">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ajouter un jeu..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const newGames = [...settings.games.supported_games, e.target.value.trim()];
                  handleSettingChange('games', 'supported_games', newGames);
                  e.target.value = '';
                }
              }}
            />
            <span className="input-group-text">Entrée pour ajouter</span>
          </div>
        </SettingItem>

        <SettingItem 
          label="Jeux personnalisés" 
          description="Autoriser les utilisateurs à proposer de nouveaux jeux"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.games.allow_custom_games}
              onChange={(e) => handleSettingChange('games', 'allow_custom_games', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Durée de match par défaut" 
          description="Durée estimée d'un match (minutes)"
        >
          <input
            type="number"
            className="form-control"
            min="5"
            max="180"
            value={settings.games.default_match_duration}
            onChange={(e) => handleSettingChange('games', 'default_match_duration', parseInt(e.target.value))}
          />
        </SettingItem>

        <SettingItem 
          label="Résolution automatique" 
          description="Délai avant résolution auto des conflits (minutes)"
        >
          <select
            className="form-select"
            value={settings.games.auto_resolve_timeout}
            onChange={(e) => handleSettingChange('games', 'auto_resolve_timeout', parseInt(e.target.value))}
          >
            <option value="60">1 heure</option>
            <option value="360">6 heures</option>
            <option value="720">12 heures</option>
            <option value="1440">24 heures</option>
            <option value="2880">48 heures</option>
            <option value="4320">72 heures</option>
          </select>
        </SettingItem>
      </div>
    </div>
  );

  const renderNotificationsSettings = () => (
    <div className="card border-0 shadow-sm">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-bell me-2"></i>
          Paramètres de Notifications
        </h5>
      </div>
      <div className="card-body">
        <SettingItem 
          label="Notifications email" 
          description="Envoyer des notifications par email"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications.email_notifications}
              onChange={(e) => handleSettingChange('notifications', 'email_notifications', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Notifications SMS" 
          description="Envoyer des notifications par SMS"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications.sms_notifications}
              onChange={(e) => handleSettingChange('notifications', 'sms_notifications', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Notifications push" 
          description="Notifications push sur les appareils mobiles"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications.push_notifications}
              onChange={(e) => handleSettingChange('notifications', 'push_notifications', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Alertes admin" 
          description="Notifications pour les administrateurs"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications.admin_alerts}
              onChange={(e) => handleSettingChange('notifications', 'admin_alerts', e.target.checked)}
            />
          </div>
        </SettingItem>

        <SettingItem 
          label="Notifications de conflits" 
          description="Alertes lors de nouveaux conflits"
        >
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={settings.notifications.dispute_notifications}
              onChange={(e) => handleSettingChange('notifications', 'dispute_notifications', e.target.checked)}
            />
          </div>
        </SettingItem>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h3 mb-1">
                <i className="fas fa-cog me-2"></i>
                Paramètres Administrateur
              </h2>
              <p className="text-muted mb-0">Configuration de la plateforme PlayInBet</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary"
                onClick={fetchSettings}
                disabled={loading}
              >
                <i className="fas fa-sync-alt me-1"></i>
                Actualiser
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                <i className="fas fa-save me-1"></i>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Message de sauvegarde */}
      {savedMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="fas fa-check-circle me-2"></i>
          {savedMessage}
        </div>
      )}

      {/* Onglets */}
      <div className="row">
        <div className="col-lg-3 mb-4">
          <div className="nav nav-pills flex-column">
            <TabButton
              id="platform"
              label="Plateforme"
              icon="fas fa-cog"
              active={activeTab === 'platform'}
              onClick={setActiveTab}
            />
            <TabButton
              id="security"
              label="Sécurité"
              icon="fas fa-shield-alt"
              active={activeTab === 'security'}
              onClick={setActiveTab}
            />
            <TabButton
              id="games"
              label="Jeux"
              icon="fas fa-gamepad"
              active={activeTab === 'games'}
              onClick={setActiveTab}
            />
            <TabButton
              id="notifications"
              label="Notifications"
              icon="fas fa-bell"
              active={activeTab === 'notifications'}
              onClick={setActiveTab}
            />
          </div>
        </div>

        <div className="col-lg-9">
          {activeTab === 'platform' && renderPlatformSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'games' && renderGamesSettings()}
          {activeTab === 'notifications' && renderNotificationsSettings()}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
