import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

const Wallet = () => {
  const { user, isAuthenticated, updateUserTickets } = useAuth();
  const { showNotification } = useNotification();
  
  // États
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // États pour le retrait
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount_euros: '',
    bank_account_holder: '',
    bank_iban: '',
    bank_bic: ''
  });
  const [withdrawalErrors, setWithdrawalErrors] = useState({});
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

  // Données simulées pour l'achat
  const ticketPackages = [
    { amount: 100, price: 5, bonus: 0, popular: false },
    { amount: 250, price: 10, bonus: 25, popular: false },
    { amount: 500, price: 20, bonus: 75, popular: true },
    { amount: 1000, price: 35, bonus: 200, popular: false },
    { amount: 2500, price: 75, bonus: 750, popular: false },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      fetchWithdrawals();
      loadSimulatedTransactions();
    }
  }, [isAuthenticated]);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/api/withdrawals/history/');
      setWithdrawals(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des retraits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimulatedTransactions = () => {
    // Transactions simulées pour l'historique
    setTransactions([
      {
        id: 1,
        type: 'credit',
        amount: 100,
        description: 'Bonus d\'inscription',
        date: new Date().toISOString(),
        status: 'completed'
      },
      {
        id: 2,
        type: 'debit',
        amount: 25,
        description: 'Duel Match amical foot vs PlayerX',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      },
      {
        id: 3,
        type: 'credit',
        amount: 50,
        description: 'Victoire tournoi 1V1 Sniper',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ]);
  };

  const handleBuyTickets = (packageData) => {
    // Simulation d'achat
    const totalTickets = packageData.amount + packageData.bonus;
    const newTotal = (user?.tickets || 0) + totalTickets;
    
    updateUserTickets(newTotal);
    showNotification(
      `Achat réussi ! Vous avez reçu ${totalTickets} tickets (${packageData.bonus > 0 ? `+${packageData.bonus} bonus` : 'aucun bonus'}) 🎫`,
      'success'
    );
    setShowBuyModal(false);
    
    // Ajouter la transaction
    const newTransaction = {
      id: Date.now(),
      type: 'credit',
      amount: totalTickets,
      description: `Achat de ${packageData.amount} tickets ${packageData.bonus > 0 ? `(+${packageData.bonus} bonus)` : ''}`,
      date: new Date().toISOString(),
      status: 'completed'
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    setWithdrawalLoading(true);
    setWithdrawalErrors({});

    try {
      const response = await api.post('/api/withdrawals/', withdrawalForm);
      
      showNotification(
        `Demande de retrait de ${withdrawalForm.amount_euros}€ créée avec succès ! Les tickets ont été déduits.`,
        'success'
      );
      
      // Réinitialiser le formulaire
      setWithdrawalForm({
        amount_euros: '',
        bank_account_holder: '',
        bank_iban: '',
        bank_bic: ''
      });
      setShowWithdrawModal(false);
      
      // Actualiser les données
      fetchWithdrawals();
      updateUserTickets(); // Recharger les tickets de l'utilisateur
      
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      
      if (error.response?.data) {
        setWithdrawalErrors(error.response.data);
      } else {
        showNotification('Erreur lors de la demande de retrait', 'error');
      }
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const getEurosAvailable = () => {
    return Math.floor((user?.tickets || 0) / 10);
  };

  const getTicketsRemainder = () => {
    return (user?.tickets || 0) % 10;
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { class: 'bg-warning text-dark', text: 'En attente', icon: '⏳' },
      'processing': { class: 'bg-info', text: 'En cours', icon: '🔄' },
      'completed': { class: 'bg-success', text: 'Terminé', icon: '✅' },
      'failed': { class: 'bg-danger', text: 'Échoué', icon: '❌' },
      'cancelled': { class: 'bg-secondary', text: 'Annulé', icon: '🚫' }
    };
    
    const statusInfo = statusMap[status] || statusMap['pending'];
    return (
      <span className={`badge ${statusInfo.class}`}>
        {statusInfo.icon} {statusInfo.text}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <div className="card card-custom p-5">
          <h3 className="text-white mb-3">🔒 Accès restreint</h3>
          <p className="text-muted mb-4">
            Vous devez être connecté pour accéder à votre portefeuille.
          </p>
          <p className="text-warning">
            Connectez-vous pour gérer vos tickets et voir vos transactions !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-white mb-0">
          💰 Mon Portefeuille
        </h2>
      </div>

      <div className="row">
        {/* Solde et conversion */}
        <div className="col-lg-8 mb-4">
          <div className="card card-custom">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-white">
                <i className="fas fa-wallet me-2"></i>Solde et conversion
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Tickets actuels */}
                <div className="col-md-4 mb-3">
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="display-4 text-warning mb-2">🎫</div>
                    <h3 className="text-primary mb-1">{user?.tickets || 0}</h3>
                    <p className="text-muted mb-0">Tickets disponibles</p>
                  </div>
                </div>

                {/* Conversion en euros */}
                <div className="col-md-4 mb-3">
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="display-4 text-warning mb-2">💶</div>
                    <h3 className="text-success mb-1">{getEurosAvailable()}€</h3>
                    <p className="text-muted mb-0">
                      Disponible pour retrait
                      {getTicketsRemainder() > 0 && (
                        <small className="d-block">
                          (+{getTicketsRemainder()} tickets restants)
                        </small>
                      )}
                    </p>
                  </div>
                </div>

                {/* Taux de conversion */}
                <div className="col-md-4 mb-3">
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="display-4 text-warning mb-2">🔄</div>
                    <h5 className="text-info mb-1">1€ = 10 tickets</h5>
                    <p className="text-muted mb-0">Taux de conversion</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="row mt-3">
                <div className="col-md-6">
                  <button 
                    className="btn btn-primary w-100"
                    onClick={() => setShowBuyModal(true)}
                  >
                    <i className="fas fa-plus me-2"></i>Acheter des tickets
                  </button>
                </div>
                <div className="col-md-6">
                  <button 
                    className="btn btn-success w-100"
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={getEurosAvailable() === 0}
                  >
                    <i className="fas fa-euro-sign me-2"></i>
                    Retirer en euros
                    {getEurosAvailable() === 0 && ' (Minimum 10 tickets)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retraits récents */}
        <div className="col-lg-4 mb-4">
          <div className="card card-custom">
            <div className="card-header">
              <h5 className="mb-0 text-white">
                <i className="fas fa-money-bill-wave me-2"></i>Retraits récents
              </h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status"></div>
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-3">
                  <div className="text-muted">
                    <i className="fas fa-inbox fa-2x mb-2"></i>
                    <p>Aucun retrait pour le moment</p>
                  </div>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {withdrawals.slice(0, 5).map(withdrawal => (
                    <div key={withdrawal.id} className="list-group-item bg-transparent border-bottom border-secondary">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="text-white mb-1">{withdrawal.amount_euros}€</h6>
                          <small className="text-muted">
                            {formatDate(withdrawal.created_at)}
                          </small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(withdrawal.status)}
                          <div className="small text-muted mt-1">
                            {withdrawal.transaction_id && (
                              <span>ID: {withdrawal.transaction_id}</span>
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
      </div>

      {/* Historique des transactions */}
      <div className="card card-custom">
        <div className="card-header bg-transparent border-bottom border-secondary">
          <h5 className="text-white mb-0">📋 Historique des transactions</h5>
        </div>
        <div className="card-body p-0">
          {transactions.length === 0 ? (
            <div className="text-center p-5">
              <div className="text-muted">
                <i className="fas fa-receipt fa-3x mb-3"></i>
                <h5>Aucune transaction</h5>
                <p>Vos transactions apparaîtront ici</p>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <span className={`badge ${transaction.type === 'credit' ? 'bg-success' : 'bg-danger'}`}>
                          {transaction.type === 'credit' ? '➕ Crédit' : '➖ Débit'}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td className={transaction.type === 'credit' ? 'text-success' : 'text-danger'}>
                        {transaction.type === 'credit' ? '+' : '-'}{transaction.amount} 🎫
                      </td>
                      <td className="text-muted">{formatDate(transaction.date)}</td>
                      <td>
                        <span className="badge bg-success">✅ Terminé</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'achat de tickets */}
      {showBuyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content bg-dark">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-white">💳 Acheter des tickets</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowBuyModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {ticketPackages.map((pkg, index) => (
                    <div key={index} className="col-md-4 mb-3">
                      <div className={`card h-100 ${pkg.popular ? 'border-warning' : 'card-custom'}`}>
                        {pkg.popular && (
                          <div className="card-header bg-warning text-dark text-center">
                            ⭐ Plus populaire
                          </div>
                        )}
                        <div className="card-body text-center">
                          <h4 className="text-primary mb-2">{pkg.amount} 🎫</h4>
                          {pkg.bonus > 0 && (
                            <p className="text-success mb-2">
                              + {pkg.bonus} tickets bonus !
                            </p>
                          )}
                          <h5 className="text-white mb-3">{pkg.price}€</h5>
                          <button
                            className={`btn w-100 ${pkg.popular ? 'btn-warning text-dark' : 'btn-primary'}`}
                            onClick={() => handleBuyTickets(pkg)}
                          >
                            💳 Acheter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <small className="text-muted">
                    💡 Les tickets sont utilisés pour créer et rejoindre des duels. Plus vous en avez, plus vous pouvez jouer !
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content bg-dark">
              <div className="modal-header border-bottom border-secondary">
                <h5 className="modal-title text-white">💶 Retirer en euros</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowWithdrawModal(false)}
                ></button>
              </div>
              <form onSubmit={handleWithdrawal}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Conversion:</strong> 1€ = 10 tickets
                    <br />
                    <strong>Disponible:</strong> {getEurosAvailable()}€ ({user?.tickets || 0} tickets)
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-white">Montant à retirer (€)</label>
                    <input
                      type="number"
                      className={`form-control bg-dark text-white border-secondary ${withdrawalErrors.amount_euros ? 'is-invalid' : ''}`}
                      value={withdrawalForm.amount_euros}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount_euros: e.target.value })}
                      min="1"
                      max={getEurosAvailable()}
                      required
                    />
                    {withdrawalErrors.amount_euros && (
                      <div className="invalid-feedback">{withdrawalErrors.amount_euros}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-white">Titulaire du compte</label>
                    <input
                      type="text"
                      className={`form-control bg-dark text-white border-secondary ${withdrawalErrors.bank_account_holder ? 'is-invalid' : ''}`}
                      value={withdrawalForm.bank_account_holder}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bank_account_holder: e.target.value })}
                      placeholder="Nom complet du titulaire"
                      required
                    />
                    {withdrawalErrors.bank_account_holder && (
                      <div className="invalid-feedback">{withdrawalErrors.bank_account_holder}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-white">IBAN</label>
                    <input
                      type="text"
                      className={`form-control bg-dark text-white border-secondary ${withdrawalErrors.bank_iban ? 'is-invalid' : ''}`}
                      value={withdrawalForm.bank_iban}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bank_iban: e.target.value })}
                      placeholder="FR14 2004 1010 0505 0001 3M02 606"
                      required
                    />
                    {withdrawalErrors.bank_iban && (
                      <div className="invalid-feedback">{withdrawalErrors.bank_iban}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-white">BIC/SWIFT</label>
                    <input
                      type="text"
                      className={`form-control bg-dark text-white border-secondary ${withdrawalErrors.bank_bic ? 'is-invalid' : ''}`}
                      value={withdrawalForm.bank_bic}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, bank_bic: e.target.value })}
                      placeholder="BNPAFRPP"
                      required
                    />
                    {withdrawalErrors.bank_bic && (
                      <div className="invalid-feedback">{withdrawalErrors.bank_bic}</div>
                    )}
                  </div>

                  <div className="alert alert-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Attention:</strong> Les tickets seront immédiatement déduits de votre compte.
                    Le virement sera effectué sous 1-3 jours ouvrés.
                  </div>
                </div>
                <div className="modal-footer border-top border-secondary">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={withdrawalLoading || getEurosAvailable() === 0}
                  >
                    {withdrawalLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Traitement...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Demander le retrait
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
