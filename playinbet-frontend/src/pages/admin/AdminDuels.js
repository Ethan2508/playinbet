import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminDuels = () => {
  const [duels, setDuels] = useState([]);
  const [filteredDuels, setFilteredDuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDuel, setSelectedDuel] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDuels();
  }, []);

  useEffect(() => {
    filterAndSortDuels();
  }, [duels, searchTerm, filterStatus, sortBy, sortOrder]);

  const fetchDuels = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des duels admin...');
      
      // Récupérer tous les duels depuis l'API admin
      const response = await api.get('/api/admin/duels/').catch(err => {
        console.error('❌ Erreur admin duels API:', err.response?.data || err.message);
        throw err;
      });
      
      console.log('✅ Duels admin reçus:', response.data.length);
      
      // Transformer les données pour le format attendu par le composant
      const transformedDuels = response.data.map(duel => ({
        id: duel.id,
        challenger: { 
          username: duel.creator.username, 
          id: duel.creator.id 
        },
        challenged: { 
          username: duel.opponent?.username || 'En attente d\'adversaire', 
          id: duel.opponent?.id 
        },
        stake: duel.amount,
        status: duel.status,
        game_type: duel.game_display || duel.game_type,
        created_at: duel.created_at,
        started_at: duel.started_at,
        ended_at: duel.completed_at,
        winner: duel.winner ? { 
          username: duel.winner.username, 
          id: duel.winner.id 
        } : null,
        challenger_confirmed: duel.creator_ready,
        challenged_confirmed: duel.opponent_ready,
        dispute_reason: duel.status === 'disputed' ? 'Conflit de déclarations' : null,
        admin_notes: duel.admin_reason || null,
        creator_action: duel.creator_action,
        opponent_action: duel.opponent_action,
        admin_resolution: duel.admin_resolution,
        resolved_by: duel.resolved_by,
        resolved_at: duel.resolved_at
      }));

      console.log('🎯 Duels transformés:', transformedDuels.length);
      setDuels(transformedDuels);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des duels:', error);
      setLoading(false);
    }
  };

  const filterAndSortDuels = () => {
    let filtered = duels;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(duel => 
        duel.id.toString().includes(searchTerm) ||
        duel.challenger.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        duel.challenged.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        duel.game_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(duel => duel.status === filterStatus);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'started_at' || sortBy === 'ended_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDuels(filtered);
  };

  const handleDuelAction = async (duelId, action) => {
    try {
      console.log(`Action ${action} sur le duel ${duelId}`);
      
      // Simuler l'action et actualiser
      await fetchDuels();
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', text: 'En Attente' },
      active: { color: 'primary', text: 'En Cours' },
      completed: { color: 'success', text: 'Terminé' },
      dispute: { color: 'danger', text: 'Conflit' },
      cancelled: { color: 'secondary', text: 'Annulé' }
    };

    const config = statusConfig[status] || { color: 'secondary', text: status };
    return <span className={`badge bg-${config.color}`}>{config.text}</span>;
  };

  const DuelModal = ({ duel, onClose }) => {
    if (!duel) return null;

    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-swords me-2"></i>
                Détails du Duel #{duel.id}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Informations Générales</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>ID:</strong></td>
                        <td>#{duel.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Jeu:</strong></td>
                        <td>{duel.game_type}</td>
                      </tr>
                      <tr>
                        <td><strong>Mise:</strong></td>
                        <td className="text-success fw-bold">
                          {duel.stake.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Statut:</strong></td>
                        <td>{getStatusBadge(duel.status)}</td>
                      </tr>
                      <tr>
                        <td><strong>Créé le:</strong></td>
                        <td>{new Date(duel.created_at).toLocaleString('fr-FR')}</td>
                      </tr>
                      {duel.started_at && (
                        <tr>
                          <td><strong>Commencé le:</strong></td>
                          <td>{new Date(duel.started_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      )}
                      {duel.ended_at && (
                        <tr>
                          <td><strong>Terminé le:</strong></td>
                          <td>{new Date(duel.ended_at).toLocaleString('fr-FR')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="col-md-6">
                  <h6>Joueurs</h6>
                  
                  {/* Challenger */}
                  <div className="card border-primary mb-3">
                    <div className="card-header bg-primary text-white py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span><strong>{duel.challenger.username}</strong> (Challenger)</span>
                        {duel.challenger_confirmed && (
                          <i className="fas fa-check-circle" title="Confirmé"></i>
                        )}
                      </div>
                    </div>
                    <div className="card-body py-2">
                      <small>ID: {duel.challenger.id}</small>
                      {duel.winner && duel.winner.id === duel.challenger.id && (
                        <div className="mt-1">
                          <span className="badge bg-success">
                            <i className="fas fa-crown me-1"></i>
                            Vainqueur
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Challenged */}
                  <div className="card border-info">
                    <div className="card-header bg-info text-white py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <span><strong>{duel.challenged.username}</strong> (Challengé)</span>
                        {duel.challenged_confirmed && (
                          <i className="fas fa-check-circle" title="Confirmé"></i>
                        )}
                      </div>
                    </div>
                    <div className="card-body py-2">
                      <small>ID: {duel.challenged.id}</small>
                      {duel.winner && duel.winner.id === duel.challenged.id && (
                        <div className="mt-1">
                          <span className="badge bg-success">
                            <i className="fas fa-crown me-1"></i>
                            Vainqueur
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes et disputes */}
              {(duel.dispute_reason || duel.admin_notes) && (
                <div className="row mt-3">
                  <div className="col-12">
                    {duel.dispute_reason && (
                      <div className="alert alert-danger">
                        <h6>
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          Raison du Conflit
                        </h6>
                        <p className="mb-0">{duel.dispute_reason}</p>
                      </div>
                    )}
                    
                    {duel.admin_notes && (
                      <div className="alert alert-info">
                        <h6>
                          <i className="fas fa-sticky-note me-2"></i>
                          Notes Admin
                        </h6>
                        <p className="mb-0">{duel.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <div className="d-flex gap-2 w-100">
                {duel.status === 'dispute' && (
                  <button 
                    className="btn btn-warning btn-sm"
                    onClick={() => handleDuelAction(duel.id, 'resolve_dispute')}
                  >
                    <i className="fas fa-gavel me-1"></i>
                    Résoudre Conflit
                  </button>
                )}
                {duel.status === 'active' && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDuelAction(duel.id, 'cancel')}
                  >
                    <i className="fas fa-times me-1"></i>
                    Annuler
                  </button>
                )}
                <button className="btn btn-secondary btn-sm ms-auto" onClick={onClose}>
                  Fermer
                </button>
              </div>
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
                <i className="fas fa-swords me-2"></i>
                Gestion des Duels
              </h2>
              <p className="text-muted mb-0">
                {filteredDuels.length} duel(s) trouvé(s) sur {duels.length} total
              </p>
            </div>
            <button className="btn btn-primary" onClick={fetchDuels}>
              <i className="fas fa-sync-alt me-1"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h3 className="text-warning mb-1">{duels.filter(d => d.status === 'pending').length}</h3>
              <small className="text-muted">En Attente</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h3 className="text-primary mb-1">{duels.filter(d => d.status === 'active').length}</h3>
              <small className="text-muted">En Cours</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h3 className="text-success mb-1">{duels.filter(d => d.status === 'completed').length}</h3>
              <small className="text-muted">Terminés</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h3 className="text-danger mb-1">{duels.filter(d => d.status === 'dispute').length}</h3>
              <small className="text-muted">Conflits</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm text-center">
            <div className="card-body">
              <h3 className="text-info mb-1">
                {duels.reduce((sum, d) => sum + d.stake, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </h3>
              <small className="text-muted">Mises Totales</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Rechercher</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ID, joueur, jeu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label">Statut</label>
              <select 
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="pending">En Attente</option>
                <option value="active">En Cours</option>
                <option value="completed">Terminés</option>
                <option value="dispute">Conflits</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Trier par</label>
              <select 
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date de création</option>
                <option value="started_at">Date de début</option>
                <option value="stake">Mise</option>
                <option value="game_type">Type de jeu</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Ordre</label>
              <select 
                className="form-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Décroissant</option>
                <option value="asc">Croissant</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des duels */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>ID</th>
                  <th>Joueurs</th>
                  <th>Jeu</th>
                  <th>Mise</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Vainqueur</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDuels.map(duel => (
                  <tr key={duel.id}>
                    <td>
                      <div className="fw-semibold">#{duel.id}</div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <small>
                          <span className="badge bg-primary me-1">C</span>
                          {duel.challenger.username}
                          {duel.challenger_confirmed && <i className="fas fa-check text-success ms-1"></i>}
                        </small>
                        <small>
                          <span className="badge bg-info me-1">D</span>
                          {duel.challenged.username}
                          {duel.challenged_confirmed && <i className="fas fa-check text-success ms-1"></i>}
                        </small>
                      </div>
                    </td>
                    <td>{duel.game_type}</td>
                    <td className="text-success fw-semibold">
                      {duel.stake.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td>{getStatusBadge(duel.status)}</td>
                    <td>
                      <small>{new Date(duel.created_at).toLocaleDateString('fr-FR')}</small>
                    </td>
                    <td>
                      {duel.winner ? (
                        <span className="badge bg-success">
                          <i className="fas fa-crown me-1"></i>
                          {duel.winner.username}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            setSelectedDuel(duel);
                            setShowModal(true);
                          }}
                          title="Voir détails"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        {duel.status === 'dispute' && (
                          <button 
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => handleDuelAction(duel.id, 'resolve_dispute')}
                            title="Résoudre conflit"
                          >
                            <i className="fas fa-gavel"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredDuels.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-swords fa-3x text-muted mb-3"></i>
              <p className="text-muted">Aucun duel trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal duel */}
      {showModal && (
        <DuelModal 
          duel={selectedDuel} 
          onClose={() => {
            setShowModal(false);
            setSelectedDuel(null);
          }} 
        />
      )}
    </div>
  );
};

export default AdminDuels;
