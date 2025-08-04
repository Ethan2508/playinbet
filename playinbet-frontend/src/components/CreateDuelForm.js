import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

const CreateDuelForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    game_type: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  // Liste des modes de jeu disponibles (organisés par catégories)
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
    <div className="modal modal-custom show d-block" style={{
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)'
    }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content" style={{
          background: 'rgba(15, 12, 41, 0.75)',
          backgroundColor: 'rgba(15, 12, 41, 0.75)',
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 191, 255, 0.2)'
        }}>
          <div className="modal-header">
            <h5 className="modal-title text-white">
              <i className="fas fa-plus me-2" style={{color: 'var(--primary-color)'}}></i>
              Créer un nouveau duel
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white" style={{fontWeight: '500'}}>
                    🎮 Mode de jeu
                  </label>
                  <select
                    className="form-select"
                    value={formData.game_type}
                    onChange={(e) => setFormData({...formData, game_type: e.target.value})}
                    required
                  >
                    <option value="">Choisir un mode de jeu</option>
                    
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
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white" style={{fontWeight: '500'}}>
                    🎫 Mise (tickets)
                  </label>
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
                <label className="form-label text-white" style={{fontWeight: '500'}}>
                  📝 Description (optionnel)
                </label>
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
              <button type="button" className="btn btn-outline-light me-2" onClick={onClose}>
                ❌ Annuler
              </button>
              <button type="submit" className="btn btn-primary-custom" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Création...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus me-2"></i>🎮 Créer le duel
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

export default CreateDuelForm;
