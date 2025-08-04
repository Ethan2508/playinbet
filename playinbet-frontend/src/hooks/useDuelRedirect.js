import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

/**
 * Hook personnalisé pour rediriger automatiquement l'utilisateur vers les duels actifs
 * Optimisé pour éviter les rafraîchissements visuels
 */
export const useDuelRedirect = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const previousDuelsRef = useRef({});
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  const checkUserDuels = useCallback(async () => {
    // Éviter les appels simultanés
    if (isCheckingRef.current || !user) return;
    
    isCheckingRef.current = true;
    
    try {
      // Récupérer tous les duels de l'utilisateur (créés ou rejoints)
      const response = await api.get('/api/duels/?my-duels=true');
      const currentDuels = response.data;

      // Vérifier chaque duel pour des changements de statut
      currentDuels.forEach(duel => {
        const duelKey = `duel_${duel.id}`;
        const previousDuel = previousDuelsRef.current[duelKey];

        // Si c'est la première fois qu'on voit ce duel, on l'enregistre silencieusement
        if (!previousDuel) {
          previousDuelsRef.current[duelKey] = {
            status: duel.status,
            hasOpponent: !!duel.opponent
          };
          return;
        }

        // Vérifier si l'utilisateur est concerné par ce duel
        const isCreator = duel.creator.id === user.id;
        const isOpponent = duel.opponent && duel.opponent.id === user.id;
        
        if (!isCreator && !isOpponent) return;

        // Détecter les transitions importantes
        const statusChanged = previousDuel.status !== duel.status;

        // Ne pas rediriger si l'utilisateur est déjà sur la page du duel
        const isAlreadyOnDuelPage = location.pathname === `/duel/${duel.id}`;

        if (isAlreadyOnDuelPage) {
          // Mettre à jour les données sans redirection
          previousDuelsRef.current[duelKey] = {
            status: duel.status,
            hasOpponent: !!duel.opponent
          };
          return;
        }

        // Scénarios de redirection (seulement pour des changements vraiment importants)
        let shouldRedirect = false;
        let notificationMessage = '';

        // 1. Créateur: Son duel vient de trouver un adversaire et passe à waiting/active
        if (isCreator && statusChanged && 
            previousDuel.status === 'open' && 
            (duel.status === 'waiting' || duel.status === 'active')) {
          shouldRedirect = true;
          notificationMessage = duel.status === 'waiting' 
            ? `⚔️ Votre duel "${duel.game_display}" a trouvé un adversaire !`
            : `🔥 Votre duel "${duel.game_display}" a commencé !`;
        }

        // 2. Adversaire: Le duel qu'il a rejoint passe à waiting ou active
        if (isOpponent && statusChanged && 
            previousDuel.status === 'open' && 
            (duel.status === 'waiting' || duel.status === 'active')) {
          shouldRedirect = true;
          notificationMessage = duel.status === 'waiting' 
            ? `⚔️ Le duel "${duel.game_display}" vous attend !`
            : `🔥 Le duel "${duel.game_display}" a commencé !`;
        }

        // Effectuer la redirection si nécessaire
        if (shouldRedirect) {
          console.log(`🎯 Redirection détectée pour le duel ${duel.id}:`, {
            previousStatus: previousDuel.status,
            newStatus: duel.status,
            isCreator,
            isOpponent
          });

          showNotification(notificationMessage, 'success');
          
          // Redirection avec un délai pour que l'utilisateur voie la notification
          setTimeout(() => {
            navigate(`/duel/${duel.id}`);
          }, 2500);
        }

        // Mettre à jour les données précédentes
        previousDuelsRef.current[duelKey] = {
          status: duel.status,
          hasOpponent: !!duel.opponent
        };
      });

    } catch (error) {
      console.error('Erreur lors de la vérification des duels:', error);
      // En cas d'erreur, on ne fait rien pour ne pas perturber l'expérience utilisateur
    } finally {
      isCheckingRef.current = false;
    }
  }, [user, navigate, location.pathname, showNotification]);

  useEffect(() => {
    if (!user) {
      // Nettoyer l'interval si l'utilisateur se déconnecte
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Vérification initiale
    checkUserDuels();

    // Vérification périodique plus espacée pour éviter les rafraîchissements
    // Seulement toutes les 15 secondes au lieu de 8
    intervalRef.current = setInterval(checkUserDuels, 15000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkUserDuels]);
};
