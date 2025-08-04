import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Matches = () => {
  const [duels, setDuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { user, updateUserTickets } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDuels();
    // Refresh automatique moins fréquent pour éviter les rafraîchissements visuels
    const interval = setInterval(() => fetchDuels(false), 15000); // 15 secondes au lieu de 10
    return () => clearInterval(interval);
  }, [filter]);

  const fetchDuels = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      
      const endpoint = filter === 'my-duels' 
        ? `/api/duels/?my-duels=true`
        : filter === 'all' 
          ? `/api/duels/`
          : `/api/duels/?filter=${filter}`;
      
      const response = await api.get(endpoint);
      let data = response.data;

      // Filtrage côté client pour les modes de jeu spécifiques
      if (filter !== 'all' && ['match_foot', 'penalty_shootout', 'ultimate_team', 'build_fight', 'box_fight', 'zone_wars', '1v1_sniper', 'tir_precis', 'combat_rapide', 'gunfight', 'course_aerienne', 'dribble_challenge', 'freestyle', 'defi_aim', 'clutch_1v1', 'headshot_only', 'knife_fight', 'quick_scope', 'trick_shot', 'speedrun', 'survival', 'deathrun', 'parkour'].includes(filter)) {
        data = data.filter(duel => duel.game_type === filter);
      }

      // Tri
      data.sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at) - new Date(a.created_at);
          case 'oldest':
            return new Date(a.created_at) - new Date(b.created_at);
          case 'highest':
            return parseFloat(b.amount) - parseFloat(a.amount);
          case 'lowest':
            return parseFloat(a.amount) - parseFloat(b.amount);
          default:
            return 0;
        }
      });

      // Éviter les re-renders inutiles en comparant les données
      const hasChanged = duels.length !== data.length || 
        duels.some((existingDuel, index) => {
          const newDuel = data[index];
          return !newDuel || 
            existingDuel.id !== newDuel.id ||
            existingDuel.status !== newDuel.status ||
            existingDuel.amount !== newDuel.amount;
        });

      if (hasChanged) {
        setDuels(data);
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des duels:', error);
      if (showLoader) {
        showNotification('Erreur lors de la récupération des duels', 'error');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fonction helper pour déterminer si l'utilisateur peut annuler un duel
  const canCancelDuel = (duel) => {
    if (!user) return false;
    
    const isCreator = duel.creator?.id === user.id;
    const isAdmin = user.is_staff || user.is_superuser;
    const isNotCompleted = !['completed', 'expired'].includes(duel.status);
    
    // Créateur peut annuler si pas d'adversaire
    if (isCreator && !duel.opponent && isNotCompleted) {
      return true;
    }
    
    // Admin peut toujours annuler (sauf si terminé)
    if (isAdmin && isNotCompleted) {
      return true;
    }
    
    return false;
  };

  const joinDuel = async (duelId) => {
    if (!user) {
      showNotification('Vous devez être connecté pour rejoindre un duel', 'error');
      return;
    }

    try {
      await api.post(`/api/duels/${duelId}/join/`);
      showNotification('Vous avez rejoint le duel avec succès !', 'success');
      
      // Redirection immédiate vers la page de duel
      navigate(`/duel/${duelId}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la participation au duel';
      showNotification(errorMessage, 'error');
    }
  };

  const updateResult = async (duelId, winnerId, proof) => {
    try {
      await api.post(`/api/duels/${duelId}/result/`, {
        winner_id: winnerId,
        proof: proof
      });
      
      showNotification('Résultat mis à jour avec succès !', 'success');
      fetchDuels();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du résultat';
      showNotification(errorMessage, 'error');
    }
  };

  const acceptResult = async (duelId) => {
    try {
      await api.post(`/api/duels/${duelId}/accept-result/`);
      showNotification('Résultat accepté !', 'success');
      
      // Récupérer les informations du duel pour mettre à jour les tickets
      const duelResponse = await api.get(`/api/duels/${duelId}/`);
      const duel = duelResponse.data;
      
      if (duel.winner && duel.winner.id === user.id) {
        const ticketsWon = parseFloat(duel.amount) * 2;
        updateUserTickets(user.tickets + ticketsWon);
        showNotification(`Félicitations ! Vous avez gagné ${ticketsWon} tickets !`, 'success');
      }
      
      fetchDuels();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'acceptation du résultat';
      showNotification(errorMessage, 'error');
    }
  };

  const disputeResult = async (duelId, reason) => {
    try {
      await api.post(`/api/duels/${duelId}/dispute/`, { reason });
      showNotification('Contestation envoyée. Un admin va examiner le duel.', 'success');
      fetchDuels();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la contestation';
      showNotification(errorMessage, 'error');
    }
  };

  const cancelDuel = async (duelId) => {
    try {
      await api.delete(`/duels/${duelId}/cancel/`);
      showNotification('Duel annulé avec succès ! Vos tickets ont été remboursés.', 'success');
      updateUserTickets(); // Mettre à jour les tickets de l'utilisateur
      fetchDuels();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'annulation du duel';
      showNotification(errorMessage, 'error');
    }
  };

  const modifyDuel = async (duelId, newData) => {
    try {
      await api.patch(`/duels/${duelId}/modify/`, newData);
      showNotification('Duel modifié avec succès !', 'success');
      updateUserTickets(); // Mettre à jour les tickets de l'utilisateur
      fetchDuels();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la modification du duel';
      showNotification(errorMessage, 'error');
    }
  };

  // Mapping des icônes pour chaque type de jeu
  const gameIcons = {
    // Sports
    match_foot: '⚽',
    penalty_shootout: '🥅',
    ultimate_team: '🏆',
    
    // Battle Royale / Construction
    build_fight: '🏗️',
    box_fight: '📦',
    zone_wars: '🌪️',
    
    // FPS / Tir
    '1v1_sniper': '🎯', 
    tir_precis: '🔫', 
    combat_rapide: '⚡', 
    gunfight: '⚔️',
    
    // Course / Voiture
    course_aerienne: '🚗', 
    dribble_challenge: '🎮', 
    freestyle: '🎪',
    
    // Stratégie / Autre
    defi_aim: '🎯',
    clutch_1v1: '🔥',
    headshot_only: '💀',
    knife_fight: '🗡️',
    quick_scope: '⚡',
    
    // Sport extrême / Autre
    trick_shot: '🎭',
    speedrun: '💨',
    survival: '🧟',
    deathrun: '☠️',
    parkour: '🏃'
  };

  // Fonction pour obtenir l'icône d'un jeu
  const getGameIcon = (gameType) => {
    return gameIcons[gameType] || '🎮';
  };

  // Fonction pour formater les noms de jeux
  const formatGameName = (gameType) => {
    const gameNames = {
      match_foot: 'Match amical foot',
      penalty_shootout: 'Séance de tirs au but',
      ultimate_team: 'Équipe ultime',
      build_fight: 'Build Fight',
      box_fight: 'Box Fight',
      zone_wars: 'Zone Wars',
      '1v1_sniper': '1V1 Sniper',
      tir_precis: 'Tir de précision',
      combat_rapide: 'Combat rapide',
      gunfight: 'Gunfight',
      course_aerienne: 'Course aérienne',
      dribble_challenge: 'Défi dribble',
      freestyle: 'Freestyle',
      defi_aim: 'Défi Aim',
      clutch_1v1: 'Clutch 1v1',
      headshot_only: 'Headshot Only',
      knife_fight: 'Combat au couteau',
      quick_scope: 'Quick Scope',
      trick_shot: 'Trick Shot',
      speedrun: 'Speedrun',
      survival: 'Mode Survie',
      deathrun: 'Deathrun',
      parkour: 'Parkour'
    };
    return gameNames[gameType] || gameType;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'primary';
      case 'ongoing': return 'warning';
      case 'pending_result': return 'info';
      case 'completed': return 'success';
      case 'disputed': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'ongoing': return 'En cours';
      case 'pending_result': return 'En attente de résultat';
      case 'completed': return 'Terminé';
      case 'disputed': return 'Contesté';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    return date.toLocaleDateString('fr-FR');
  };

  if (loading && duels.length === 0) {
    return (
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div className="col-12">
            <div className="text-center mt-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="text-white mt-3">Chargement des duels...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* En-tête */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h2 text-white mb-2">
                <i className="fas fa-gamepad me-3"></i>Duels
              </h1>
              <p className="text-muted mb-0">
                Rejoignez des duels ou créez le vôtre
              </p>
            </div>
            <div className="d-flex gap-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-coins text-warning me-2"></i>
                <span className="text-white fw-bold">{user?.tickets || 0} tickets</span>
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateForm(true)}
              >
                <i className="fas fa-plus me-2"></i>Créer un duel
              </button>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="glass-card h-100">
                <div className="card-body text-center">
                  <div className="display-6 text-primary mb-2">
                    <i className="fas fa-fire"></i>
                  </div>
                  <h5 className="text-white mb-1">{duels.filter(d => d.status === 'open').length}</h5>
                  <p className="text-muted mb-0 small">Duels ouverts</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="glass-card h-100">
                <div className="card-body text-center">
                  <div className="display-6 text-warning mb-2">
                    <i className="fas fa-clock"></i>
                  </div>
                  <h5 className="text-white mb-1">{duels.filter(d => d.status === 'ongoing').length}</h5>
                  <p className="text-muted mb-0 small">En cours</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="glass-card h-100">
                <div className="card-body text-center">
                  <div className="display-6 text-success mb-2">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h5 className="text-white mb-1">{duels.filter(d => d.status === 'completed').length}</h5>
                  <p className="text-muted mb-0 small">Terminés</p>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="glass-card h-100">
                <div className="card-body text-center">
                  <div className="display-6 text-info mb-2">
                    <i className="fas fa-user"></i>
                  </div>
                  <h5 className="text-white mb-1">
                    {user ? duels.filter(d => d.creator?.id === user.id || d.opponent?.id === user.id).length : 0}
                  </h5>
                  <p className="text-muted mb-0 small">Mes duels</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtres et tri */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="glass-card">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-white">
                        <i className="fas fa-filter me-2"></i>Filtrer par :
                      </label>
                      <select 
                        className="form-select bg-dark text-white border-secondary"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        <option value="all">🎮 Tous les jeux</option>
                        
                        <optgroup label="🏆 SPORT">
                          <option value="match_foot">⚽ Match amical foot</option>
                          <option value="penalty_shootout">🥅 Séance de tirs au but</option>
                          <option value="ultimate_team">🏆 Équipe ultime</option>
                          <option value="freestyle">🎪 Freestyle</option>
                          <option value="dribble_challenge">🎮 Défi dribble</option>
                        </optgroup>
                        
                        <optgroup label="🎮 COMPÉTITION">
                          <option value="build_fight">🏗️ Build Fight</option>
                          <option value="box_fight">📦 Box Fight</option>
                          <option value="zone_wars">🌪️ Zone Wars</option>
                          <option value="1v1_sniper">🎯 1V1 Sniper</option>
                          <option value="tir_precis">🔫 Tir de précision</option>
                          <option value="combat_rapide">⚡ Combat rapide</option>
                          <option value="gunfight">⚔️ Gunfight</option>
                          <option value="defi_aim">🎯 Défi Aim</option>
                          <option value="clutch_1v1">🔥 Clutch 1v1</option>
                          <option value="headshot_only">💀 Headshot Only</option>
                          <option value="knife_fight">🗡️ Combat au couteau</option>
                          <option value="quick_scope">⚡ Quick Scope</option>
                        </optgroup>
                        
                        <optgroup label="🚗 COURSE">
                          <option value="course_aerienne">🚗 Course aérienne</option>
                        </optgroup>
                        
                        <optgroup label="🎯 DÉFIS">
                          <option value="trick_shot">🎭 Trick Shot</option>
                          <option value="speedrun">💨 Speedrun</option>
                          <option value="survival">🧟 Mode Survie</option>
                          <option value="deathrun">☠️ Deathrun</option>
                          <option value="parkour">🏃 Parkour</option>
                        </optgroup>
                        
                        <optgroup label="📊 STATUT">
                          <option value="open">🔥 Duels ouverts</option>
                          <option value="ongoing">⏳ En cours</option>
                          <option value="completed">✅ Terminés</option>
                          <option value="my-duels">👤 Mes duels</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-white">
                        <i className="fas fa-sort me-2"></i>Trier par :
                      </label>
                      <select 
                        className="form-select bg-dark text-white border-secondary"
                        value={sortBy}
                        onChange={(e) => {setSortBy(e.target.value); fetchDuels();}}
                      >
                        <option value="newest">📅 Plus récents</option>
                        <option value="oldest">📅 Plus anciens</option>
                        <option value="highest">💰 Mise la plus élevée</option>
                        <option value="lowest">💰 Mise la plus faible</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des duels */}
          <div className="row">
            {duels.length === 0 ? (
              <div className="col-12">
                <div className="glass-card text-center py-5">
                  <div className="display-1 text-muted mb-3">
                    <i className="fas fa-gamepad"></i>
                  </div>
                  <h3 className="text-white mb-3">Aucun duel trouvé</h3>
                  <p className="text-muted mb-4">
                    {filter === 'all' 
                      ? "Il n'y a actuellement aucun duel disponible. Soyez le premier à en créer un !" 
                      : "Aucun duel ne correspond à vos critères de recherche."}
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <i className="fas fa-plus me-2"></i>Créer le premier duel
                  </button>
                </div>
              </div>
            ) : (
              duels.map(duel => (
                <div key={duel.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="glass-card h-100">
                    <div className="card-body">
                      {/* En-tête du duel */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="d-flex align-items-center">
                          <span className="fs-4 me-2">{getGameIcon(duel.game_type)}</span>
                          <div>
                            <h6 className="text-white mb-1">{formatGameName(duel.game_type)}</h6>
                            <small className="text-muted">{formatDate(duel.created_at)}</small>
                          </div>
                        </div>
                        <span className={`badge bg-${getStatusColor(duel.status)}`}>
                          {getStatusText(duel.status)}
                        </span>
                      </div>

                      {/* Mise */}
                      <div className="text-center mb-3">
                        <div className="display-6 text-warning">
                          <i className="fas fa-coins"></i>
                        </div>
                        <h4 className="text-white mb-1">{duel.amount} tickets</h4>
                        <p className="text-muted small mb-0">Mise du duel</p>
                      </div>

                      {/* Participants */}
                      <div className="row text-center mb-3">
                        <div className="col-6">
                          <div className="d-flex flex-column align-items-center">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center mb-2" 
                                 style={{width: '40px', height: '40px'}}>
                              <i className="fas fa-user text-white"></i>
                            </div>
                            <small className="text-white fw-bold">{duel.creator?.username}</small>
                            <small className="text-muted">Créateur</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex flex-column align-items-center">
                            {duel.opponent ? (
                              <>
                                <div className="bg-success rounded-circle d-flex align-items-center justify-content-center mb-2" 
                                     style={{width: '40px', height: '40px'}}>
                                  <i className="fas fa-user text-white"></i>
                                </div>
                                <small className="text-white fw-bold">{duel.opponent.username}</small>
                                <small className="text-muted">Adversaire</small>
                              </>
                            ) : (
                              <>
                                <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center mb-2" 
                                     style={{width: '40px', height: '40px'}}>
                                  <i className="fas fa-question text-white"></i>
                                </div>
                                <small className="text-muted">En attente</small>
                                <small className="text-muted">d'adversaire</small>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {duel.description && (
                        <div className="mb-3">
                          <p className="text-muted small mb-0 text-center">
                            "{duel.description}"
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="d-grid">
                        {duel.status === 'open' && user && duel.creator?.id !== user.id && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => joinDuel(duel.id)}
                          >
                            <i className="fas fa-sword me-2"></i>Rejoindre le duel
                          </button>
                        )}
                        
                        {(duel.status === 'in_progress' || duel.status === 'waiting') && user && (duel.creator?.id === user.id || duel.opponent?.id === user.id) && (
                          <button 
                            className="btn btn-success"
                            onClick={() => navigate(`/duel/${duel.id}`)}
                          >
                            <i className="fas fa-gamepad me-2"></i>Entrer dans la DuelRoom
                          </button>
                        )}
                        
                        {duel.status === 'ongoing' && user && (duel.creator?.id === user.id || duel.opponent?.id === user.id) && (
                          <div className="d-flex gap-2">
                            <button 
                              className="btn btn-warning flex-fill"
                              data-bs-toggle="modal" 
                              data-bs-target={`#resultModal${duel.id}`}
                            >
                              <i className="fas fa-trophy me-2"></i>Signaler résultat
                            </button>
                            {canCancelDuel(duel) && (
                              <button 
                                className="btn btn-danger"
                                onClick={() => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler ce duel ? Tous les participants seront remboursés.')) {
                                    cancelDuel(duel.id);
                                  }
                                }}
                                title="Annuler le duel (Admin)"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            )}
                          </div>
                        )}
                        
                        {duel.status === 'pending_result' && user && (
                          <>
                            {duel.result_submitter?.id !== user.id ? (
                              <div className="d-grid gap-2">
                                <div className="d-flex gap-2">
                                  <button 
                                    className="btn btn-success flex-fill"
                                    onClick={() => acceptResult(duel.id)}
                                  >
                                    <i className="fas fa-check me-2"></i>Accepter le résultat
                                  </button>
                                  <button 
                                    className="btn btn-danger flex-fill"
                                    data-bs-toggle="modal" 
                                    data-bs-target={`#disputeModal${duel.id}`}
                                  >
                                    <i className="fas fa-exclamation-triangle me-2"></i>Contester
                                  </button>
                                </div>
                                {canCancelDuel(duel) && (
                                  <button 
                                    className="btn btn-outline-danger mt-2"
                                    onClick={() => {
                                      if (window.confirm('Êtes-vous sûr de vouloir annuler ce duel ? Tous les participants seront remboursés.')) {
                                        cancelDuel(duel.id);
                                      }
                                    }}
                                    title="Annuler le duel (Admin)"
                                  >
                                    <i className="fas fa-times me-2"></i>Annuler le duel
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="alert alert-info mb-2">
                                  <i className="fas fa-clock me-2"></i>
                                  En attente de validation de l'adversaire
                                </div>
                                {canCancelDuel(duel) && (
                                  <button 
                                    className="btn btn-outline-danger w-100"
                                    onClick={() => {
                                      if (window.confirm('Êtes-vous sûr de vouloir annuler ce duel ? Tous les participants seront remboursés.')) {
                                        cancelDuel(duel.id);
                                      }
                                    }}
                                    title="Annuler le duel (Admin)"
                                  >
                                    <i className="fas fa-times me-2"></i>Annuler le duel
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        {duel.status === 'completed' && (
                          <div className="alert alert-success mb-0">
                            <i className="fas fa-trophy me-2"></i>
                            Gagnant : <strong>{duel.winner?.username}</strong>
                          </div>
                        )}
                        
                        {duel.status === 'disputed' && (
                          <div>
                            <div className="alert alert-warning mb-2">
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              Duel contesté - En cours d'examen
                            </div>
                            {canCancelDuel(duel) && (
                              <button 
                                className="btn btn-outline-danger w-100"
                                onClick={() => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler ce duel ? Tous les participants seront remboursés.')) {
                                    cancelDuel(duel.id);
                                  }
                                }}
                                title="Annuler le duel (Admin)"
                              >
                                <i className="fas fa-times me-2"></i>Annuler le duel
                              </button>
                            )}
                          </div>
                        )}
                        
                        {duel.status === 'open' && user && duel.creator?.id === user.id && (
                          <div className="d-grid gap-2">
                            <div className="alert alert-info mb-2">
                              <i className="fas fa-clock me-2"></i>
                              En attente d'un adversaire
                            </div>
                            <div className="d-flex gap-2">
                              <button 
                                className="btn btn-warning flex-fill"
                                data-bs-toggle="modal" 
                                data-bs-target={`#modifyModal${duel.id}`}
                              >
                                <i className="fas fa-edit me-2"></i>Modifier
                              </button>
                              <button 
                                className="btn btn-danger flex-fill"
                                onClick={() => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler ce duel ? Vos tickets seront remboursés.')) {
                                    cancelDuel(duel.id);
                                  }
                                }}
                              >
                                <i className="fas fa-times me-2"></i>Annuler
                              </button>
                            </div>
                          </div>
                        )}

                        {(duel.status === 'waiting' || duel.status === 'open') && user && duel.creator?.id !== user.id && !duel.opponent && (
                          <div className="alert alert-success mb-0">
                            <i className="fas fa-user-plus me-2"></i>
                            Disponible pour rejoindre
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Modal pour signaler résultat */}
                  <ResultModal 
                    duel={duel} 
                    user={user} 
                    onSubmit={updateResult} 
                  />
                  
                  {/* Modal pour contester */}
                  <DisputeModal 
                    duel={duel} 
                    onSubmit={disputeResult} 
                  />
                  
                  {/* Modal pour modifier le duel */}
                  <ModifyDuelModal 
                    duel={duel} 
                    onSubmit={modifyDuel} 
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de création de duel */}
      {showCreateForm && (
        <CreateDuelModal 
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchDuels();
          }}
        />
      )}
    </div>
  );
};

// Modal pour signaler un résultat
const ResultModal = ({ duel, user, onSubmit }) => {
  const [winnerId, setWinnerId] = useState('');
  const [proof, setProof] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (winnerId && proof.trim()) {
      onSubmit(duel.id, parseInt(winnerId), proof);
      setWinnerId('');
      setProof('');
      // Fermer le modal
      const modal = document.getElementById(`resultModal${duel.id}`);
      const bootstrapModal = window.bootstrap?.Modal?.getInstance(modal);
      bootstrapModal?.hide();
    }
  };

  return (
    <div className="modal fade" id={`resultModal${duel.id}`} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content bg-dark border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-white">
              <i className="fas fa-trophy me-2"></i>Signaler le résultat
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label text-white">Qui a gagné ?</label>
                <select 
                  className="form-select bg-dark text-white border-secondary"
                  value={winnerId}
                  onChange={(e) => setWinnerId(e.target.value)}
                  required
                >
                  <option value="">Sélectionner le gagnant</option>
                  <option value={duel.creator?.id}>{duel.creator?.username}</option>
                  {duel.opponent && (
                    <option value={duel.opponent.id}>{duel.opponent.username}</option>
                  )}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Preuve (URL ou description)</label>
                <textarea 
                  className="form-control bg-dark text-white border-secondary"
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Lien vers une capture d'écran, vidéo, ou description détaillée du résultat"
                  rows="3"
                  required
                />
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fas fa-check me-2"></i>Signaler le résultat
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal pour contester un résultat
const DisputeModal = ({ duel, onSubmit }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(duel.id, reason);
      setReason('');
      // Fermer le modal
      const modal = document.getElementById(`disputeModal${duel.id}`);
      const bootstrapModal = window.bootstrap?.Modal?.getInstance(modal);
      bootstrapModal?.hide();
    }
  };

  return (
    <div className="modal fade" id={`disputeModal${duel.id}`} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content bg-dark border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-warning">
              <i className="fas fa-exclamation-triangle me-2"></i>Contester le résultat
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-info-circle me-2"></i>
                Une contestation sera examinée par un administrateur. Assurez-vous d'avoir une raison valide.
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Raison de la contestation</label>
                <textarea 
                  className="form-control bg-dark text-white border-secondary"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Expliquez pourquoi vous contestez ce résultat..."
                  rows="4"
                  required
                />
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" className="btn btn-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>Contester
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal de création de duel
const CreateDuelModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    game_type: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Liste des modes de jeu disponibles
  const gameOptions = [
    // Sports
    { value: 'match_foot', label: 'Match amical foot', icon: '⚽' },
    { value: 'penalty_shootout', label: 'Séance de tirs au but', icon: '🥅' },
    { value: 'ultimate_team', label: 'Équipe ultime', icon: '🏆' },
    
    // Battle Royale / Construction
    { value: 'build_fight', label: 'Build Fight', icon: '🏗️' },
    { value: 'box_fight', label: 'Box Fight', icon: '📦' },
    { value: 'zone_wars', label: 'Zone Wars', icon: '🌪️' },
    
    // FPS / Tir
    { value: '1v1_sniper', label: '1V1 Sniper', icon: '🎯' },
    { value: 'tir_precis', label: 'Tir de précision', icon: '🔫' },
    { value: 'combat_rapide', label: 'Combat rapide', icon: '⚡' },
    { value: 'gunfight', label: 'Gunfight', icon: '⚔️' },
    
    // Course / Voiture
    { value: 'course_aerienne', label: 'Course aérienne', icon: '🚗' },
    { value: 'dribble_challenge', label: 'Défi dribble', icon: '🎮' },
    { value: 'freestyle', label: 'Freestyle', icon: '🎪' },
    
    // Stratégie / Autre
    { value: 'defi_aim', label: 'Défi Aim', icon: '🎯' },
    { value: 'clutch_1v1', label: 'Clutch 1v1', icon: '🔥' },
    { value: 'headshot_only', label: 'Headshot Only', icon: '💀' },
    { value: 'knife_fight', label: 'Combat au couteau', icon: '🗡️' },
    { value: 'quick_scope', label: 'Quick Scope', icon: '⚡' },
    
    // Sport extrême / Autre
    { value: 'trick_shot', label: 'Trick Shot', icon: '🎭' },
    { value: 'speedrun', label: 'Speedrun', icon: '💨' },
    { value: 'survival', label: 'Mode Survie', icon: '🧟' },
    { value: 'deathrun', label: 'Deathrun', icon: '☠️' },
    { value: 'parkour', label: 'Parkour', icon: '🏃' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/duels/', formData);
      showNotification('Duel créé avec succès !', 'success');
      onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la création du duel';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark border-secondary">
          <div className="modal-header border-secondary">
            <h5 className="modal-title text-white">
              <i className="fas fa-plus me-2"></i>Créer un nouveau duel
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Mode de jeu</label>
                  <select
                    className="form-select bg-dark text-white border-secondary"
                    value={formData.game_type}
                    onChange={(e) => setFormData({...formData, game_type: e.target.value})}
                    required
                  >
                    <option value="">Choisir un mode de jeu</option>
                    
                    <optgroup label="🏆 SPORT">
                      {gameOptions.filter(g => ['match_foot', 'penalty_shootout', 'ultimate_team', 'freestyle', 'dribble_challenge'].includes(g.value)).map(game => (
                        <option key={game.value} value={game.value}>
                          {game.icon} {game.label}
                        </option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="🎮 COMPÉTITION">
                      {gameOptions.filter(g => ['build_fight', 'box_fight', 'zone_wars', '1v1_sniper', 'tir_precis', 'combat_rapide', 'gunfight', 'defi_aim', 'clutch_1v1', 'headshot_only', 'knife_fight', 'quick_scope'].includes(g.value)).map(game => (
                        <option key={game.value} value={game.value}>
                          {game.icon} {game.label}
                        </option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="🚗 COURSE">
                      {gameOptions.filter(g => ['course_aerienne'].includes(g.value)).map(game => (
                        <option key={game.value} value={game.value}>
                          {game.icon} {game.label}
                        </option>
                      ))}
                    </optgroup>
                    
                    <optgroup label="🎯 DÉFIS">
                      {gameOptions.filter(g => ['trick_shot', 'speedrun', 'survival', 'deathrun', 'parkour'].includes(g.value)).map(game => (
                        <option key={game.value} value={game.value}>
                          {game.icon} {game.label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Mise (tickets)</label>
                  <input
                    type="number"
                    className="form-control bg-dark text-white border-secondary"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    min="1"
                    max="1000"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Description (optionnel)</label>
                <textarea
                  className="form-control bg-dark text-white border-secondary"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ajoutez des détails sur votre duel..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>Créer le duel
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal pour modifier un duel
const ModifyDuelModal = ({ duel, onSubmit }) => {
  const [formData, setFormData] = useState({
    amount: duel.amount,
    game_type: duel.game_type,
    description: duel.description || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onSubmit(duel.id, formData);
      // Fermer le modal
      const modal = document.getElementById(`modifyModal${duel.id}`);
      const bootstrapModal = window.bootstrap?.Modal?.getInstance(modal);
      bootstrapModal?.hide();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id={`modifyModal${duel.id}`} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content modal-custom">
          <div className="modal-header">
            <h5 className="modal-title text-white">
              <i className="fas fa-edit me-2"></i>Modifier le duel
            </h5>
            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Type de jeu</label>
                  <select
                    className="form-select"
                    value={formData.game_type}
                    onChange={(e) => setFormData({...formData, game_type: e.target.value})}
                    required
                  >
                    <optgroup label="🎮 Gaming Général">
                      <option value="defi_aim">🎯 Défi Aim</option>
                      <option value="clutch_1v1">🔥 Clutch 1v1</option>
                      <option value="headshot_only">💀 Headshot Only</option>
                      <option value="knife_fight">🗡️ Combat au couteau</option>
                      <option value="quick_scope">⚡ Quick Scope</option>
                    </optgroup>
                    <optgroup label="⚽ Sports">
                      <option value="match_foot">⚽ Match amical foot</option>
                      <option value="penalty_shootout">🥅 Séance de tirs au but</option>
                      <option value="ultimate_team">🏆 Équipe ultime</option>
                    </optgroup>
                    <optgroup label="🏗️ Construction / Battle Royale">
                      <option value="build_fight">🏗️ Build Fight</option>
                      <option value="box_fight">📦 Box Fight</option>
                      <option value="zone_wars">🌪️ Zone Wars</option>
                    </optgroup>
                    <optgroup label="🔫 FPS / Tir">
                      <option value="1v1_sniper">🎯 1V1 Sniper</option>
                      <option value="tir_precis">🔫 Tir de précision</option>
                      <option value="combat_rapide">⚡ Combat rapide</option>
                      <option value="gunfight">⚔️ Gunfight</option>
                    </optgroup>
                    <optgroup label="🚗 Course / Voiture">
                      <option value="course_aerienne">🚗 Course aérienne</option>
                      <option value="dribble_challenge">🎮 Défi dribble</option>
                      <option value="freestyle">🎪 Freestyle</option>
                    </optgroup>
                    <optgroup label="🎭 Sport extrême / Autre">
                      <option value="trick_shot">🎭 Trick Shot</option>
                      <option value="speedrun">💨 Speedrun</option>
                      <option value="survival">🧟 Mode Survie</option>
                      <option value="deathrun">☠️ Deathrun</option>
                      <option value="parkour">🏃 Parkour</option>
                    </optgroup>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Mise (tickets)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    min="1"
                    max="1000"
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Description (optionnel)</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Ajoutez des détails sur votre duel..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Annuler
              </button>
              <button type="submit" className="btn btn-warning" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Modification...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>Modifier le duel
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Matches;
