import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

/**
 * Hook ultra-léger pour rediriger Jean (créateur) quand son duel trouve un adversaire
 * Optimisé pour éviter tout rafraîchissement visuel
 */
export const useCreatorDuelAlert = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const lastCheckRef = useRef(0);
  const trackedDuelsRef = useRef(new Set());

  // Fonction pour créer une notification spéciale avec bouton
  const showSpecialNotification = (duel) => {
    // Créer un élément de notification personnalisé
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-with-action';
    notificationElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, rgba(15, 12, 41, 0.95), rgba(48, 43, 99, 0.95));
      backdrop-filter: blur(20px);
      border: 1px solid rgba(0, 191, 255, 0.3);
      border-radius: 12px;
      padding: 20px;
      color: white;
      z-index: 10000;
      min-width: 350px;
      max-width: 400px;
      box-shadow: 0 20px 40px rgba(0, 191, 255, 0.2);
      animation: slideInRight 0.4s ease-out;
    `;
    
    notificationElement.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <div style="font-size: 24px; margin-right: 12px;">🎮</div>
        <div>
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px;">
            Adversaire trouvé !
          </div>
          <div style="font-size: 14px; color: #b0b0b0;">
            ${duel.opponent.username} a rejoint votre duel "${duel.game_display}"
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button 
          id="join-duel-btn" 
          style="
            flex: 1;
            background: linear-gradient(45deg, #00BFFF, #0099cc);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0, 191, 255, 0.4)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
        >
          ⚔️ Rejoindre le duel
        </button>
        <button 
          id="dismiss-notification-btn"
          style="
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            color: white;
            padding: 12px 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 14px;
          "
          onmouseover="this.style.background='rgba(255, 255, 255, 0.2)';"
          onmouseout="this.style.background='rgba(255, 255, 255, 0.1)';"
        >
          ✕
        </button>
      </div>
    `;

    // Ajouter les event listeners
    const joinBtn = notificationElement.querySelector('#join-duel-btn');
    const dismissBtn = notificationElement.querySelector('#dismiss-notification-btn');
    
    joinBtn.addEventListener('click', () => {
      navigate(`/duel/${duel.id}`);
      document.body.removeChild(notificationElement);
    });
    
    dismissBtn.addEventListener('click', () => {
      notificationElement.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(notificationElement)) {
          document.body.removeChild(notificationElement);
        }
      }, 300);
    });

    // Auto-suppression après 10 secondes
    setTimeout(() => {
      if (document.body.contains(notificationElement)) {
        notificationElement.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
          if (document.body.contains(notificationElement)) {
            document.body.removeChild(notificationElement);
          }
        }, 300);
      }
    }, 10000);

    // Ajouter au DOM
    document.body.appendChild(notificationElement);
  };

  useEffect(() => {
    if (!user) return;

    // Ne vérifier que si on n'est PAS sur une DuelRoom
    if (location.pathname.startsWith('/duel/')) return;

    const checkCreatorDuels = async () => {
      const now = Date.now();
      
      // Limiter à une vérification toutes les 20 secondes maximum
      if (now - lastCheckRef.current < 20000) return;
      
      lastCheckRef.current = now;

      try {
        // Récupérer SEULEMENT les duels créés par l'utilisateur avec statut 'open'
        const response = await api.get('/api/duels/?my-duels=true');
        const myDuels = response.data.filter(duel => 
          duel.creator.id === user.id && 
          duel.status === 'open'
        );

        // Vérifier les nouveaux duels qui viennent de trouver un adversaire
        myDuels.forEach(duel => {
          const duelKey = `creator_${duel.id}`;
          
          // Si ce duel a maintenant un adversaire et qu'on ne l'avait pas encore tracké
          if (duel.opponent && !trackedDuelsRef.current.has(duelKey)) {
            trackedDuelsRef.current.add(duelKey);
            
            // Créer une notification spéciale avec bouton rejoindre
            showSpecialNotification(duel);
          }
        });

        // Nettoyer les duels qui ne sont plus 'open'
        const currentOpenDuelIds = new Set(myDuels.map(d => `creator_${d.id}`));
        trackedDuelsRef.current = new Set([...trackedDuelsRef.current].filter(key => 
          currentOpenDuelIds.has(key)
        ));

      } catch (error) {
        // Échec silencieux pour ne pas perturber l'expérience
        console.log('Vérification duels créateur échouée (normal si pas connecté)');
      }
    };

    // Vérification initiale
    checkCreatorDuels();

    // Vérification très espacée pour éviter tout rafraîchissement
    const interval = setInterval(checkCreatorDuels, 20000);

    return () => clearInterval(interval);
  }, [user, navigate, location.pathname, showNotification]);
};
