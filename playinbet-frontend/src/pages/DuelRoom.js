import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

const DuelRoom = () => {
  const { duelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // États du duel
  const [duelData, setDuelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [duelStatus, setDuelStatus] = useState('waiting');
  const [playerAction, setPlayerAction] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMarkingReady, setIsMarkingReady] = useState(false);

  // Récupération des données réelles du duel
  useEffect(() => {
    const fetchDuelData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/duels/${duelId}/`);
        const duel = response.data;
        
        const newDuelData = {
          id: duel.id,
          gameMode: duel.game_display,
          gameCategory: duel.category_display,
          stake: duel.amount,
          totalPot: duel.amount * 2,
          player1: {
            id: duel.creator.id,
            username: duel.creator.username,
            avatar: '🎯',
            isCurrentUser: duel.creator.id === user?.id,
            ready: duel.creator_ready
          },
          player2: duel.opponent ? {
            id: duel.opponent.id,
            username: duel.opponent.username,
            avatar: '🔫',
            isCurrentUser: duel.opponent.id === user?.id,
            ready: duel.opponent_ready
          } : null,
          createdAt: new Date(duel.created_at),
          startedAt: duel.started_at ? new Date(duel.started_at) : null,
          duration: duel.duration_minutes * 60,
          status: duel.status,
          winner: duel.winner,
          bothPlayersReady: duel.both_players_ready
        };

        // Éviter les re-renders inutiles en comparant les données importantes
        const hasChanged = !duelData || 
          duelData.status !== duel.status ||
          duelData.bothPlayersReady !== duel.both_players_ready ||
          (duelData.player1?.ready !== duel.creator_ready) ||
          (duelData.player2?.ready !== duel.opponent_ready);

        if (hasChanged) {
          setDuelData(newDuelData);
          setDuelStatus(duel.status);
          
          // Vérifier si l'utilisateur actuel est prêt
          if (user?.id === duel.creator.id) {
            setIsReady(duel.creator_ready);
          } else if (user?.id === duel.opponent?.id) {
            setIsReady(duel.opponent_ready);
          }
        }
        
        // Calculer le temps écoulé seulement si nécessaire
        if (duel.started_at) {
          const now = new Date();
          const startedAt = new Date(duel.started_at);
          const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
          setTimeElapsed(elapsed);
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération du duel:', error);
        navigate('/matches');
      } finally {
        setLoading(false);
      }
    };

    fetchDuelData();
    
    // Mise à jour automatique moins fréquente pour éviter les rafraîchissements visuels
    const interval = setInterval(fetchDuelData, 5000); // 5 secondes au lieu de 3
    return () => clearInterval(interval);
  }, [duelId, user, navigate]);

  // Timer pour le temps écoulé (optimisé pour éviter les re-renders)
  useEffect(() => {
    if ((duelStatus === 'active' || duelStatus === 'in_progress') && duelData?.startedAt) {
      const timer = setInterval(() => {
        setTimeElapsed(prevElapsed => {
          const now = new Date();
          const startedAt = new Date(duelData.startedAt);
          const newElapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
          
          // Éviter de mettre à jour si la valeur n'a pas changé
          if (newElapsed === prevElapsed) {
            return prevElapsed;
          }
          
          return newElapsed;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [duelStatus, duelData?.startedAt]);

  // Marquer comme prêt
  const handleMarkReady = async () => {
    if (isMarkingReady) return;
    
    try {
      setIsMarkingReady(true);
      const response = await api.post(`/api/duels/${duelId}/ready/`);
      
      if (response.data.duel_started) {
        showNotification('🎮 Le duel commence ! Les deux joueurs sont prêts.', 'success');
      } else {
        showNotification('✅ Vous êtes prêt ! En attente de votre adversaire...', 'success');
      }
      
      setIsReady(true);
    } catch (error) {
      showNotification('Erreur lors du marquage comme prêt', 'error');
    } finally {
      setIsMarkingReady(false);
    }
  };

  // Format du temps écoulé
  const formatTimeElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Actions du joueur
  const handlePlayerAction = async (action) => {
    if (!user || !duelData) return;
    
    const confirmMessages = {
      victory: "Êtes-vous sûr de vouloir déclarer votre victoire ? Vous devrez peut-être fournir une preuve.",
      defeat: "Êtes-vous sûr d'admettre votre défaite ? Cette action est irréversible.",
      forfeit: "Êtes-vous sûr de vouloir abandonner ce duel ? Vous perdrez votre mise."
    };
    
    if (!window.confirm(confirmMessages[action])) {
      return;
    }
    
    try {
      setLoading(true);
      let response;
      
      switch (action) {
        case 'victory':
          response = await api.patch(`/duels/${duelId}/claim_victory/`);
          break;
        case 'defeat':
          response = await api.patch(`/duels/${duelId}/admit_defeat/`);
          break;
        case 'forfeit':
          response = await api.patch(`/duels/${duelId}/forfeit/`);
          break;
        default:
          throw new Error('Action non reconnue');
      }
      
      const result = response.data;
      
      // Afficher le message de résultat
      showNotification(result.message, 'success');
      
      // Si le duel est terminé, rediriger après un délai
      if (result.status === 'completed') {
        setTimeout(() => {
          navigate('/matches');
        }, 3000);
      }
      
      // Recharger les données du duel
      setPlayerAction(action);
      
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'action';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card card-custom">
              <div className="card-body text-center py-5">
                <div className="spinner-custom mx-auto mb-3"></div>
                <h4 className="text-white">Chargement du duel...</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!duelData) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card card-custom">
              <div className="card-body text-center py-5">
                <h4 className="text-white">Duel non trouvé</h4>
                <button 
                  className="btn btn-primary mt-3"
                  onClick={() => navigate('/matches')}
                >
                  Retour aux duels
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si le duel n'a pas encore d'adversaire
  if (!duelData.player2) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card card-custom">
              <div className="card-body text-center py-5">
                <h3 className="text-white mb-3">🎮 En attente d'un adversaire...</h3>
                <p className="text-muted mb-4">
                  Votre duel "{duelData.gameMode}" attend qu'un joueur le rejoigne.
                </p>
                <div className="mb-4">
                  <h5 className="text-warning">🎫 {duelData.stake} tickets en jeu</h5>
                </div>
                <div className="spinner-custom mx-auto mb-3"></div>
                <button 
                  className="btn btn-outline-light mt-3"
                  onClick={() => navigate('/matches')}
                >
                  Retour aux duels
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-md-10">

          {/* Header du duel */}
          <div className="card card-custom mb-4">
            <div className="card-body text-center">
              <h2 className="text-white mb-2">
                {duelData.gameCategory} - {duelData.gameMode}
              </h2>
              <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                <div className="text-center">
                  <div style={{ fontSize: '3rem' }}>{duelData.player1.avatar}</div>
                  <h5 className={`${duelData.player1.isCurrentUser ? 'text-primary' : 'text-info'}`}>
                    {duelData.player1.username}
                  </h5>
                  <div className="mt-2">
                    {duelData.player1.ready ? (
                      <span className="badge bg-success">✅ Prêt</span>
                    ) : (
                      <span className="badge bg-warning">⏳ En attente</span>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-warning">🎫 {duelData.totalPot}</h3>
                  <small className="text-muted">Tickets en jeu</small>
                  <div className="text-white mt-2">VS</div>
                </div>
                
                <div className="text-center">
                  <div style={{ fontSize: '3rem' }}>{duelData.player2.avatar}</div>
                  <h5 className={`${duelData.player2.isCurrentUser ? 'text-primary' : 'text-info'}`}>
                    {duelData.player2.username}
                  </h5>
                  <div className="mt-2">
                    {duelData.player2.ready ? (
                      <span className="badge bg-success">✅ Prêt</span>
                    ) : (
                      <span className="badge bg-warning">⏳ En attente</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* État du duel et actions */}
          {duelStatus === 'waiting' && (
            <div className="card card-custom mb-4">
              <div className="card-body text-center">
                <h4 className="text-white mb-3">⏳ En attente que les deux joueurs soient prêts</h4>
                
                {!isReady ? (
                  <div>
                    <p className="text-muted mb-3">
                      Cliquez sur "Prêt" quand vous êtes prêt à commencer le duel !
                    </p>
                    <button 
                      className="btn btn-success btn-lg"
                      onClick={handleMarkReady}
                      disabled={isMarkingReady}
                    >
                      {isMarkingReady ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2"></div>
                          Marquage en cours...
                        </>
                      ) : (
                        <>✅ Je suis prêt !</>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-success mb-3">
                      ✅ Vous êtes prêt ! En attente de votre adversaire...
                    </p>
                    <div className="spinner-custom mx-auto"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Duel actif */}
          {(duelStatus === 'active' || duelStatus === 'in_progress') && (
            <>
              {/* Timer et statut */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="card card-custom">
                    <div className="card-body text-center">
                      <h5 className="text-white">⏱️ Temps écoulé</h5>
                      <h2 className="text-primary">{formatTimeElapsed(timeElapsed)}</h2>
                      <small className="text-muted">Depuis le début du duel</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card card-custom">
                    <div className="card-body text-center">
                      <h5 className="text-white">🎯 Statut</h5>
                      <h3 className="text-success">EN COURS</h3>
                      <small className="text-muted">Duel en progression</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions du joueur */}
              <div className="card card-custom mb-4">
                <div className="card-body">
                  <h4 className="text-white text-center mb-4">🎮 Actions du duel</h4>
                  
                  <div className="row text-center">
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-success btn-lg w-100"
                        onClick={() => handlePlayerAction('victory')}
                      >
                        🏆 Victoire
                      </button>
                      <small className="text-muted d-block mt-2">Je déclare ma victoire</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-danger btn-lg w-100"
                        onClick={() => handlePlayerAction('defeat')}
                      >
                        💀 Défaite
                      </button>
                      <small className="text-muted d-block mt-2">J'admets ma défaite</small>
                    </div>
                    
                    <div className="col-md-4 mb-3">
                      <button 
                        className="btn btn-warning btn-lg w-100"
                        onClick={() => handlePlayerAction('forfeit')}
                      >
                        🏃 Forfait
                      </button>
                      <small className="text-muted d-block mt-2">J'abandonne le duel</small>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bouton retour */}
          <div className="text-center">
            <button 
              className="btn btn-outline-light"
              onClick={() => navigate('/matches')}
            >
              ← Retour aux duels
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DuelRoom;
