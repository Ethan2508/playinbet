import React from 'react';
import { useCreatorDuelAlert } from '../hooks/useCreatorDuelAlert';

/**
 * Composant wrapper ultra-léger pour alerter les créateurs de duels
 * Version optimisée qui ne cause aucun rafraîchissement visuel
 */
const DuelRedirectWrapper = ({ children }) => {
  // Active seulement l'alerte pour les créateurs (Jean)
  useCreatorDuelAlert();
  
  // Retourne simplement les enfants sans modification
  return children;
};

export default DuelRedirectWrapper;
