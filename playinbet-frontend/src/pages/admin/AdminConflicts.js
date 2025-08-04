import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminConflicts = () => {
  const [conflicts, setConflicts] = useState([]);
  const [filteredConflicts, setFilteredConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionReason, setResolutionReason] = useState('');

  useEffect(() => {
    fetchConflicts();
  }, []);

  useEffect(() => {
    filterConflicts();
  }, [conflicts, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConflicts = async () => {
    try {
      setLoading(true);
      // Récupérer les duels en litige depuis l'API
      const response = await api.get('/api/admin/duels/', {
        params: { status: 'disputed' }
      });
      
      // Transformer les données pour le format attendu par le composant
      const transformedConflicts = response.data.map(duel => ({
        id: duel.id,
        duel_id: duel.id,
        challenger: { 
          username: duel.creator.username, 
          id: duel.creator.id 
        },
        challenged: { 
          username: duel.opponent?.username || 'Adversaire inconnu', 
          id: duel.opponent?.id 
        },
        stake: duel.amount,
        status: 'dispute', // Mapper 'disputed' vers 'dispute' pour le composant
        dispute_reason: 'Conflit de déclarations - les deux joueurs revendiquent la victoire',
        created_at: duel.created_at,
        updated_at: duel.created_at,
        disputed_at: duel.created_at, // Approximation
        claim_details: {
          challenger_claim: duel.creator_action,
          challenged_claim: duel.opponent_action,
          challenger_proof: duel.creator_screenshot ? 'Screenshot disponible' : 'Aucune preuve',
          challenged_proof: duel.opponent_screenshot ? 'Screenshot disponible' : 'Aucune preuve'
        },
        admin_resolution: duel.admin_resolution ? 'resolved' : null,
        resolution_reason: duel.admin_reason
      }));

      setConflicts(transformedConflicts);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des conflits:', error);
      setLoading(false);
    }
  };

  const filterConflicts = () => {
    let filtered = conflicts;

    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        filtered = filtered.filter(conflict => conflict.status === 'dispute');
      } else {
        filtered = filtered.filter(conflict => conflict.status === filterStatus);
      }
    }

    // Trier par date de création (plus récent en premier)
    filtered.sort((a, b) => new Date(b.disputed_at) - new Date(a.disputed_at));

    setFilteredConflicts(filtered);
  };

  const handleResolveConflict = async (conflictId, resolution, reason) => {
    try {
      console.log('🔧 Résolution conflit:', { conflictId, resolution, reason });
      
      if (resolution === 'challenger_wins') {
        // Résoudre en faveur du challenger (créateur)
        const conflict = conflicts.find(c => c.id === conflictId);
        const response = await api.patch(`/admin/duels/${conflictId}/resolve_dispute/`, {
          winner_id: String(conflict.challenger.id), // Convertir en chaîne
          admin_reason: reason
        });
        console.log('✅ Résolution challenger:', response.data);
      } else if (resolution === 'challenged_wins') {
        // Résoudre en faveur du challengé (adversaire)
        const conflict = conflicts.find(c => c.id === conflictId);
        const response = await api.patch(`/admin/duels/${conflictId}/resolve_dispute/`, {
          winner_id: String(conflict.challenged.id), // Convertir en chaîne
          admin_reason: reason
        });
        console.log('✅ Résolution challenged:', response.data);
      } else if (resolution === 'refund' || resolution === 'cancel') {
        // Annuler et rembourser
        const response = await api.patch(`/admin/duels/${conflictId}/cancel_duel/`, {
          reason: reason
        });
        console.log('✅ Annulation:', response.data);
      } else {
        alert('Type de résolution non supporté: ' + resolution);
        return;
      }
      
      // Mettre à jour localement
      setConflicts(prevConflicts => 
        prevConflicts.map(conflict => 
          conflict.id === conflictId 
            ? { 
                ...conflict, 
                status: 'resolved', 
                admin_resolution: resolution,
                resolution_reason: reason,
                updated_at: new Date().toISOString()
              }
            : conflict
        )
      );

      setShowModal(false);
      setSelectedConflict(null);
      setResolution('');
      setResolutionReason('');
      
      // Recharger la liste pour avoir les données à jour
      setTimeout(() => {
        fetchConflicts();
      }, 500);
      
      alert('Conflit résolu avec succès !');
    } catch (error) {
      console.error('❌ Erreur lors de la résolution:', error);
      console.error('Détails erreur:', error.response?.data || error.message);
      alert('Erreur lors de la résolution du conflit: ' + (error.response?.data?.error || error.message));
    }
  };

  const ConflictModal = ({ conflict, onClose }) => {
    const [localResolution, setLocalResolution] = useState('');
    const [localResolutionReason, setLocalResolutionReason] = useState('');
    
    if (!conflict) return null;

    const handleSubmitResolution = (e) => {
      e.preventDefault();
      console.log('📝 Soumission résolution:', { localResolution, localResolutionReason });
      if (localResolution && localResolutionReason) {
        handleResolveConflict(conflict.id, localResolution, localResolutionReason);
      } else {
        alert('Veuillez sélectionner une résolution et saisir une justification');
      }
    };

    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-gavel me-2"></i>
                Résolution du Conflit - Duel #{conflict.duel_id}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                {/* Informations du duel */}
                <div className="col-md-6">
                  <h6 className="border-bottom pb-2 mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Informations du Duel
                  </h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>ID du Duel:</strong></td>
                        <td>#{conflict.duel_id}</td>
                      </tr>
                      <tr>
                        <td><strong>Challenger:</strong></td>
                        <td>{conflict.challenger.username}</td>
                      </tr>
                      <tr>
                        <td><strong>Challengé:</strong></td>
                        <td>{conflict.challenged.username}</td>
                      </tr>
                      <tr>
                        <td><strong>Mise:</strong></td>
                        <td className="text-success fw-bold">
                          {conflict.stake} tickets
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Date du conflit:</strong></td>
                        <td>{new Date(conflict.disputed_at).toLocaleString('fr-FR')}</td>
                      </tr>
                      <tr>
                        <td><strong>Raison du conflit:</strong></td>
                        <td className="text-danger">{conflict.dispute_reason}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Réclamations des joueurs */}
                <div className="col-md-6">
                  <h6 className="border-bottom pb-2 mb-3">
                    <i className="fas fa-users me-2"></i>
                    Réclamations des Joueurs
                  </h6>
                  
                  {/* Challenger */}
                  <div className="card border-primary mb-3">
                    <div className="card-header bg-primary text-white py-2">
                      <strong>{conflict.challenger.username} (Challenger)</strong>
                    </div>
                    <div className="card-body py-2">
                      <p className="mb-1">
                        <strong>Réclamation:</strong> 
                        <span className={`badge ms-2 bg-${conflict.claim_details.challenger_claim === 'victory' ? 'success' : 'warning'}`}>
                          {conflict.claim_details.challenger_claim === 'victory' ? 'Victoire' : 
                           conflict.claim_details.challenger_claim === 'defeat' ? 'Défaite' : 'Match nul'}
                        </span>
                      </p>
                      <p className="mb-0">
                        <strong>Preuves:</strong> {conflict.claim_details.challenger_proof}
                      </p>
                    </div>
                  </div>

                  {/* Challenged */}
                  <div className="card border-info">
                    <div className="card-header bg-info text-white py-2">
                      <strong>{conflict.challenged.username} (Challengé)</strong>
                    </div>
                    <div className="card-body py-2">
                      <p className="mb-1">
                        <strong>Réclamation:</strong> 
                        <span className={`badge ms-2 bg-${conflict.claim_details.challenged_claim === 'victory' ? 'success' : 'warning'}`}>
                          {conflict.claim_details.challenged_claim === 'victory' ? 'Victoire' : 
                           conflict.claim_details.challenged_claim === 'defeat' ? 'Défaite' : 'Match nul'}
                        </span>
                      </p>
                      <p className="mb-0">
                        <strong>Preuves:</strong> {conflict.claim_details.challenged_proof}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Résolution admin */}
              {conflict.status === 'dispute' && (
                <div className="row mt-4">
                  <div className="col-12">
                    <h6 className="border-bottom pb-2 mb-3">
                      <i className="fas fa-balance-scale me-2"></i>
                      Résolution Administrative
                    </h6>
                    <form onSubmit={handleSubmitResolution}>
                      <div className="row">
                        <div className="col-md-6">
                          <label className="form-label">Décision:</label>
                          <select 
                            className="form-select"
                            value={localResolution}
                            onChange={(e) => setLocalResolution(e.target.value)}
                            required
                          >
                            <option value="">Choisir une résolution...</option>
                            <option value="challenger_wins">Victoire du Challenger ({conflict.challenger.username})</option>
                            <option value="challenged_wins">Victoire du Challengé ({conflict.challenged.username})</option>
                            <option value="refund">Remboursement des deux joueurs</option>
                            <option value="cancel">Annulation du duel</option>
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Justification:</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Expliquez votre décision..."
                            value={localResolutionReason}
                            onChange={(e) => setLocalResolutionReason(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <button type="submit" className="btn btn-success me-2">
                          <i className="fas fa-check me-1"></i>
                          Confirmer la Résolution
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Résolution existante */}
              {conflict.status === 'resolved' && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className="alert alert-success">
                      <h6>
                        <i className="fas fa-check-circle me-2"></i>
                        Conflit Résolu
                      </h6>
                      <p className="mb-2">
                        <strong>Décision:</strong> {conflict.admin_resolution}
                      </p>
                      <p className="mb-0">
                        <strong>Justification:</strong> {conflict.resolution_reason}
                      </p>
                      <small className="text-muted">
                        Résolu le {new Date(conflict.updated_at).toLocaleString('fr-FR')}
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
                <i className="fas fa-gavel me-2"></i>
                Gestion des Conflits
              </h2>
              <p className="text-muted mb-0">
                {filteredConflicts.length} conflit(s) 
                {filterStatus === 'pending' ? ' en attente' : 
                 filterStatus === 'resolved' ? ' résolu(s)' : ''}
              </p>
            </div>
            <button className="btn btn-primary" onClick={fetchConflicts}>
              <i className="fas fa-sync-alt me-1"></i>
              Actualiser
            </button>
            <button 
              className="btn btn-outline-info" 
              onClick={async () => {
                try {
                  console.log('🧪 Test API...');
                  const response = await api.get('/api/admin/duels/?status=disputed');
                  console.log('✅ API fonctionne:', response.data);
                  alert(`API OK: ${response.data.length} conflit(s) trouvé(s)`);
                } catch (error) {
                  console.error('❌ Erreur API:', error);
                  alert('Erreur API: ' + error.message);
                }
              }}
            >
              <i className="fas fa-vial me-1"></i>
              Test API
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-danger" style={{ borderLeftWidth: '4px !important' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 bg-danger bg-opacity-10 me-3">
                  <i className="fas fa-exclamation-triangle text-danger fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">En Attente</h6>
                  <h3 className="mb-0 fw-bold">
                    {conflicts.filter(c => c.status === 'dispute').length}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-success" style={{ borderLeftWidth: '4px !important' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 bg-success bg-opacity-10 me-3">
                  <i className="fas fa-check-circle text-success fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Résolus</h6>
                  <h3 className="mb-0 fw-bold">
                    {conflicts.filter(c => c.status === 'resolved').length}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm border-start border-warning" style={{ borderLeftWidth: '4px !important' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="rounded-circle p-3 bg-warning bg-opacity-10 me-3">
                  <i className="fas fa-euro-sign text-warning fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Mise Totale</h6>
                  <h3 className="mb-0 fw-bold">
                    {conflicts
                      .filter(c => c.status === 'dispute')
                      .reduce((sum, c) => sum + c.stake, 0)
                      .toLocaleString('fr-FR')} tickets
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Statut</label>
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="pending">En attente</option>
                <option value="resolved">Résolus</option>
                <option value="all">Tous</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des conflits */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Duel</th>
                  <th>Joueurs</th>
                  <th>Mise</th>
                  <th>Statut</th>
                  <th>Date du Conflit</th>
                  <th>Raison</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredConflicts.map(conflict => (
                  <tr key={conflict.id}>
                    <td>
                      <div className="fw-semibold">#{conflict.duel_id}</div>
                      <small className="text-muted">ID: {conflict.id}</small>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <small>
                          <span className="badge bg-primary me-1">C</span>
                          {conflict.challenger.username}
                        </small>
                        <small>
                          <span className="badge bg-info me-1">D</span>
                          {conflict.challenged.username}
                        </small>
                      </div>
                    </td>
                    <td className="text-success fw-semibold">
                      {conflict.stake} tickets
                    </td>
                    <td>
                      <span className={`badge bg-${
                        conflict.status === 'dispute' ? 'danger' : 'success'
                      }`}>
                        {conflict.status === 'dispute' ? 'En Attente' : 'Résolu'}
                      </span>
                    </td>
                    <td>
                      <small>{new Date(conflict.disputed_at).toLocaleDateString('fr-FR')}</small>
                    </td>
                    <td>
                      <small>{conflict.dispute_reason}</small>
                    </td>
                    <td>
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setShowModal(true);
                        }}
                      >
                        <i className="fas fa-gavel me-1"></i>
                        {conflict.status === 'dispute' ? 'Résoudre' : 'Voir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredConflicts.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-balance-scale fa-3x text-muted mb-3"></i>
              <p className="text-muted">Aucun conflit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de résolution */}
      {showModal && (
        <ConflictModal 
          conflict={selectedConflict} 
          onClose={() => {
            setShowModal(false);
            setSelectedConflict(null);
            setResolution('');
            setResolutionReason('');
          }} 
        />
      )}
    </div>
  );
};

export default AdminConflicts;
