import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('victories'); // victories, tickets
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/api/users/');
      let sortedUsers = response.data.results || response.data;
      
      // Trier selon le critère sélectionné
      sortedUsers.sort((a, b) => {
        if (sortBy === 'victories') {
          return (b.victories || 0) - (a.victories || 0);
        } else {
          return (b.tickets || 0) - (a.tickets || 0);
        }
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getRankColor = (position) => {
    switch (position) {
      case 1: return 'text-warning';
      case 2: return 'text-light';
      case 3: return 'text-warning';
      default: return 'text-muted';
    }
  };

  const getUserPosition = () => {
    if (!isAuthenticated || !user) return null;
    return users.findIndex(u => u.id === user.id) + 1;
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-white">🏆 Classement</h1>
        <div className="d-flex gap-2">
          <button
            className={`btn ${sortBy === 'victories' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setSortBy('victories')}
          >
            🏆 Par victoires
          </button>
          <button
            className={`btn ${sortBy === 'tickets' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setSortBy('tickets')}
          >
            🎫 Par tickets
          </button>
        </div>
      </div>

      {/* User's current position */}
      {isAuthenticated && (
        <div className="card card-custom p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="text-white mb-1">Votre position actuelle</h5>
              <p className="text-muted mb-0">
                Vous êtes classé {getUserPosition() || 'Non classé'} sur {users.length} joueurs
              </p>
            </div>
            <div className="text-end">
              <div className="d-flex gap-3">
                <div>
                  <small className="text-muted d-block">Victoires</small>
                  <span className="text-success fw-bold">{user?.victories || 0}</span>
                </div>
                <div>
                  <small className="text-muted d-block">Tickets</small>
                  <span className="text-warning fw-bold">{user?.tickets || 0}</span>
                </div>
                <div>
                  <small className="text-muted d-block">Rang</small>
                  <span className="text-info fw-bold">{user?.rank || 'Débutant'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-primary">{users.length}</h4>
            <small className="text-muted">Joueurs classés</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-warning">
              {users.reduce((total, user) => total + (user.victories || 0), 0)}
            </h4>
            <small className="text-muted">Victoires totales</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-success">
              {Math.max(...users.map(u => u.victories || 0), 0)}
            </h4>
            <small className="text-muted">Record de victoires</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-info">
              {Math.max(...users.map(u => u.tickets || 0), 0)}
            </h4>
            <small className="text-muted">Maximum de tickets</small>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card card-custom">
        <div className="card-header bg-transparent border-bottom border-secondary">
          <h5 className="text-white mb-0">
            📊 Classement {sortBy === 'victories' ? 'par victoires' : 'par tickets'}
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center p-5">
              <div className="spinner-custom mx-auto mb-3"></div>
              <p className="text-muted">Chargement du classement...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-5">
              <h4 className="text-white mb-3">👥 Aucun joueur classé</h4>
              <p className="text-muted">
                Le classement sera disponible dès qu'il y aura des joueurs inscrits.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th className="border-secondary">Position</th>
                    <th className="border-secondary">Joueur</th>
                    <th className="border-secondary">🏆 Victoires</th>
                    <th className="border-secondary">🎫 Tickets</th>
                    <th className="border-secondary">📊 Rang</th>
                    <th className="border-secondary">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((leaderUser, index) => {
                    const position = index + 1;
                    const isCurrentUser = isAuthenticated && user?.id === leaderUser.id;
                    
                    return (
                      <tr 
                        key={leaderUser.id}
                        className={isCurrentUser ? 'table-primary' : ''}
                        style={{ backgroundColor: isCurrentUser ? 'rgba(0, 191, 255, 0.1)' : 'transparent' }}
                      >
                        <td>
                          <div className="d-flex align-items-center">
                            <span className={`me-2 ${getRankColor(position)}`} style={{ fontSize: '1.5rem' }}>
                              {getRankIcon(position)}
                            </span>
                            <span className={`fw-bold ${getRankColor(position)}`}>
                              #{position}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="text-white fw-bold">
                              {leaderUser.username}
                            </span>
                            {isCurrentUser && (
                              <span className="badge bg-primary ms-2">Vous</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="text-success fw-bold">
                            {leaderUser.victories || 0}
                          </span>
                        </td>
                        <td>
                          <span className="text-warning fw-bold">
                            {leaderUser.tickets || 0}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {leaderUser.rank || 'Débutant'}
                          </span>
                        </td>
                        <td>
                          {leaderUser.victories >= 50 ? (
                            <span className="badge bg-success">🔥 Expert</span>
                          ) : leaderUser.victories >= 20 ? (
                            <span className="badge bg-warning text-dark">⭐ Confirmé</span>
                          ) : leaderUser.victories >= 5 ? (
                            <span className="badge bg-info">📈 En progression</span>
                          ) : (
                            <span className="badge bg-secondary">🌱 Débutant</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!isAuthenticated && (
        <div className="card card-custom mt-4 p-4 text-center">
          <h5 className="text-white mb-3">🔒 Connectez-vous pour voir votre position</h5>
          <p className="text-muted mb-3">
            Inscrivez-vous et commencez à jouer pour apparaître dans le classement !
          </p>
          <button className="btn btn-primary-custom">
            ✨ Rejoindre PlayInBet
          </button>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;