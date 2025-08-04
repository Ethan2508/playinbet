import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import tournamentAPI from '../api/tournaments';

const Tournaments = () => {
  const { user, updateUserTickets } = useAuth();
  const { showNotification } = useNotification();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'all') {
        response = await tournamentAPI.getAll();
      } else {
        response = await tournamentAPI.getByStatus(filter);
      }
      
      setTournaments(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tournois:', error);
      showNotification('Erreur lors du chargement des tournois', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (tournamentId, entryFee) => {
    if (user.tickets < entryFee) {
      showNotification('Vous n\'avez pas assez de tickets pour vous inscrire', 'error');
      return;
    }

    try {
      await tournamentAPI.register(tournamentId);
      
      // Mettre à jour les tickets de l'utilisateur
      updateUserTickets(user.tickets - entryFee);
      
      // Recharger les tournois pour voir les changements
      fetchTournaments();
      
      showNotification('Inscription réussie au tournoi !', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      showNotification(errorMessage, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'upcoming': { color: 'secondary', text: 'À venir' },
      'open': { color: 'success', text: 'Inscriptions ouvertes' },
      'ongoing': { color: 'warning', text: 'En cours' },
      'completed': { color: 'primary', text: 'Terminé' },
      'cancelled': { color: 'danger', text: 'Annulé' }
    };
    
    const statusInfo = statusMap[status] || { color: 'secondary', text: status };
    
    return (
      <span className={`badge bg-${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getGameIcon = (game) => {
    const icons = {
      // Sport
      'match_foot': '⚽',
      'penalty_shootout': '🥅',
      'ultimate_team': '🏆',
      'freestyle': '🎪',
      'dribble_challenge': '🎮',
      
      // Compétition
      'build_fight': '🏗️',
      'box_fight': '📦',
      'zone_wars': '🌪️',
      '1v1_sniper': '🎯',
      'tir_precis': '🔫',
      'combat_rapide': '⚡',
      'gunfight': '⚔️',
      'defi_aim': '🎯',
      'clutch_1v1': '🔥',
      'headshot_only': '💀',
      'knife_fight': '🗡️',
      'quick_scope': '⚡',
      
      // Course
      'course_aerienne': '🚗',
      
      // Défis
      'trick_shot': '🎭',
      'speedrun': '💨',
      'survival': '🧟',
      'deathrun': '☠️',
      'parkour': '🏃'
    };
    return icons[game] || '🎮';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserRegistered = (tournament) => {
    return tournament.participants.some(p => p.user.id === user?.id);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-white mb-0">
              <i className="fas fa-trophy me-2"></i>
              Tournois
            </h2>
            <div className="d-flex gap-2">
              <select 
                className="form-select bg-dark text-white border-secondary"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="all">Tous les tournois</option>
                <option value="open">Inscriptions ouvertes</option>
                <option value="ongoing">En cours</option>
                <option value="upcoming">À venir</option>
                <option value="completed">Terminés</option>
              </select>
            </div>
          </div>

          {tournaments.length === 0 ? (
            <div className="glass-card text-center">
              <div className="p-5">
                <i className="fas fa-trophy fa-3x text-muted mb-3"></i>
                <h4 className="text-white">Aucun tournoi trouvé</h4>
                <p className="text-light opacity-75">
                  {filter === 'all' 
                    ? 'Aucun tournoi n\'est disponible pour le moment.'
                    : `Aucun tournoi ${filter === 'open' ? 'ouvert aux inscriptions' : filter} pour le moment.`
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="row">
              {tournaments.map(tournament => (
                <div key={tournament.id} className="col-lg-6 col-xl-4 mb-4">
                  <div className="glass-card h-100">
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="text-white mb-1 d-flex align-items-center">
                            <span className="me-2 fs-4">{getGameIcon(tournament.game)}</span>
                            {tournament.name}
                          </h5>
                          <small className="text-light opacity-75">{tournament.game_display}</small>
                        </div>
                        {getStatusBadge(tournament.status)}
                      </div>

                      <p className="text-light opacity-75 mb-3">
                        {tournament.description}
                      </p>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="bg-dark bg-opacity-50 rounded p-2 text-center">
                            <div className="text-warning fw-bold">{tournament.entry_fee}</div>
                            <small className="text-light opacity-75">Prix d'entrée</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="bg-dark bg-opacity-50 rounded p-2 text-center">
                            <div className="text-success fw-bold">{tournament.prize_pool}</div>
                            <small className="text-light opacity-75">Prize Pool</small>
                          </div>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="bg-dark bg-opacity-50 rounded p-2 text-center">
                            <div className="text-info fw-bold">
                              {tournament.current_participants}/{tournament.max_participants}
                            </div>
                            <small className="text-light opacity-75">Participants</small>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="bg-dark bg-opacity-50 rounded p-2 text-center">
                            <div className="text-primary fw-bold">{tournament.format_display}</div>
                            <small className="text-light opacity-75">Format</small>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-light opacity-75 d-block">
                          <i className="fas fa-calendar me-1"></i>
                          Inscriptions jusqu'au {formatDate(tournament.registration_end)}
                        </small>
                        <small className="text-light opacity-75 d-block">
                          <i className="fas fa-play me-1"></i>
                          Début: {formatDate(tournament.start_date)}
                        </small>
                      </div>

                      <div className="mt-auto">
                        {isUserRegistered(tournament) ? (
                          <button className="btn btn-success w-100" disabled>
                            <i className="fas fa-check me-2"></i>
                            Inscrit
                          </button>
                        ) : tournament.can_register ? (
                          <button 
                            className="btn btn-primary w-100"
                            onClick={() => handleRegister(tournament.id, tournament.entry_fee)}
                            disabled={user?.tickets < tournament.entry_fee}
                          >
                            <i className="fas fa-sign-in-alt me-2"></i>
                            S'inscrire ({tournament.entry_fee} tickets)
                          </button>
                        ) : tournament.is_full ? (
                          <button className="btn btn-secondary w-100" disabled>
                            <i className="fas fa-users me-2"></i>
                            Complet
                          </button>
                        ) : (
                          <button className="btn btn-secondary w-100" disabled>
                            <i className="fas fa-lock me-2"></i>
                            Inscriptions fermées
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tournaments;
