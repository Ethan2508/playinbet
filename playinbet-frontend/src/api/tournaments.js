import api from './axios';

export const tournamentAPI = {
  // Récupérer tous les tournois
  getAll: (params = {}) => {
    return api.get('/api/tournaments/', { params });
  },

  // Récupérer un tournoi spécifique
  getById: (id) => {
    return api.get(`/api/tournaments/${id}/`);
  },

  // S'inscrire à un tournoi
  register: (tournamentId) => {
    return api.post(`/api/tournaments/${tournamentId}/register/`);
  },

  // Démarrer un tournoi
  start: (tournamentId) => {
    return api.post(`/api/tournaments/${tournamentId}/start/`);
  },

  // Déclarer le vainqueur d'un match
  declareMatchWinner: (tournamentId, matchId, winnerId) => {
    return api.post(`/api/tournaments/${tournamentId}/declare_match_winner/`, {
      match_id: matchId,
      winner_id: winnerId
    });
  },

  // Filtrer par statut
  getByStatus: (status) => {
    return api.get('/api/tournaments/', { params: { status } });
  },

  // Filtrer par jeu
  getByGame: (game) => {
    return api.get('/api/tournaments/', { params: { game } });
  }
};

export default tournamentAPI;
