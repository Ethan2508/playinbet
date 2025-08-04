import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, filterRole, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Récupérer les utilisateurs réels depuis l'API
      const response = await api.get('/api/users/');
      
      // Transformer les données pour inclure les statistiques de duels
      const usersWithStats = await Promise.all(
        response.data.map(async (user) => {
          try {
            // Récupérer les duels de l'utilisateur
            const duelsResponse = await api.get(`/api/duels/?creator=${user.id}`);
            const joinedDuelsResponse = await api.get(`/api/duels/?opponent=${user.id}`);
            
            const createdDuels = duelsResponse.data || [];
            const joinedDuels = joinedDuelsResponse.data || [];
            const allUserDuels = [...createdDuels, ...joinedDuels];
            
            const totalDuels = allUserDuels.length;
            const wins = allUserDuels.filter(d => d.winner?.id === user.id).length;
            const losses = allUserDuels.filter(d => d.winner && d.winner.id !== user.id).length;
            
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role || 'user',
              is_active: user.is_active !== false,
              balance: user.tickets || 0,
              total_duels: totalDuels,
              wins: wins,
              losses: losses,
              created_at: user.date_joined,
              last_login: user.last_login || user.date_joined,
              rank: user.rank || 'Débutant',
              victories: user.victories || 0
            };
          } catch (error) {
            console.error(`Erreur lors du chargement des stats pour ${user.username}:`, error);
            return {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role || 'user',
              is_active: user.is_active !== false,
              balance: user.tickets || 0,
              total_duels: 0,
              wins: 0,
              losses: 0,
              created_at: user.date_joined,
              last_login: user.last_login || user.date_joined,
              rank: user.rank || 'Débutant',
              victories: user.victories || 0
            };
          }
        })
      );

      setUsers(usersWithStats);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at' || sortBy === 'last_login') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Simuler l'action
      console.log(`Action ${action} sur l'utilisateur ${userId}`);
      
      // Actualiser la liste
      await fetchUsers();
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    }
  };

  const UserModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-user me-2"></i>
                Détails de l'utilisateur
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Informations générales</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>ID:</strong></td>
                        <td>{user.id}</td>
                      </tr>
                      <tr>
                        <td><strong>Nom d'utilisateur:</strong></td>
                        <td>{user.username}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{user.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Rôle:</strong></td>
                        <td>
                          <span className={`badge bg-${user.role === 'admin' ? 'warning' : 'primary'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Statut:</strong></td>
                        <td>
                          <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                            {user.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6>Statistiques de jeu</h6>
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td><strong>Solde:</strong></td>
                        <td className="text-success fw-bold">
                          {user.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Duels total:</strong></td>
                        <td>{user.total_duels}</td>
                      </tr>
                      <tr>
                        <td><strong>Victoires:</strong></td>
                        <td className="text-success">{user.wins}</td>
                      </tr>
                      <tr>
                        <td><strong>Défaites:</strong></td>
                        <td className="text-danger">{user.losses}</td>
                      </tr>
                      <tr>
                        <td><strong>Taux de victoire:</strong></td>
                        <td>
                          {user.total_duels > 0 
                            ? `${((user.wins / user.total_duels) * 100).toFixed(1)}%`
                            : 'N/A'
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-12">
                  <h6>Dates importantes</h6>
                  <p><strong>Inscrit le:</strong> {new Date(user.created_at).toLocaleString('fr-FR')}</p>
                  <p><strong>Dernière connexion:</strong> {new Date(user.last_login).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <div className="d-flex gap-2 w-100">
                <button 
                  className={`btn btn-${user.is_active ? 'warning' : 'success'} btn-sm`}
                  onClick={() => handleUserAction(user.id, user.is_active ? 'suspend' : 'activate')}
                >
                  {user.is_active ? 'Suspendre' : 'Activer'}
                </button>
                <button 
                  className="btn btn-info btn-sm"
                  onClick={() => handleUserAction(user.id, 'reset_password')}
                >
                  Réinitialiser mot de passe
                </button>
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
                <i className="fas fa-users me-2"></i>
                Gestion des Utilisateurs
              </h2>
              <p className="text-muted mb-0">
                {filteredUsers.length} utilisateur(s) trouvé(s) sur {users.length} total
              </p>
            </div>
            <button className="btn btn-primary" onClick={fetchUsers}>
              <i className="fas fa-sync-alt me-1"></i>
              Actualiser
            </button>
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
                  placeholder="Nom d'utilisateur ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label">Rôle</label>
              <select 
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Tous</option>
                <option value="user">Utilisateurs</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Trier par</label>
              <select 
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="created_at">Date d'inscription</option>
                <option value="last_login">Dernière connexion</option>
                <option value="username">Nom d'utilisateur</option>
                <option value="balance">Solde</option>
                <option value="total_duels">Nombre de duels</option>
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

      {/* Liste des utilisateurs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Solde</th>
                  <th>Duels</th>
                  <th>Taux victoire</th>
                  <th>Dernière connexion</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                             style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold">{user.username}</div>
                          <small className="text-muted">ID: {user.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge bg-${user.role === 'admin' ? 'warning' : 'primary'}`}>
                        {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                        {user.is_active ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="text-success fw-semibold">
                      {user.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </td>
                    <td>
                      <span className="badge bg-info">{user.total_duels}</span>
                    </td>
                    <td>
                      {user.total_duels > 0 
                        ? `${((user.wins / user.total_duels) * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <small>{new Date(user.last_login).toLocaleDateString('fr-FR')}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          title="Voir détails"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className={`btn btn-outline-${user.is_active ? 'warning' : 'success'} btn-sm`}
                          onClick={() => handleUserAction(user.id, user.is_active ? 'suspend' : 'activate')}
                          title={user.is_active ? 'Suspendre' : 'Activer'}
                        >
                          <i className={`fas fa-${user.is_active ? 'ban' : 'check'}`}></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal utilisateur */}
      {showUserModal && (
        <UserModal 
          user={selectedUser} 
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }} 
        />
      )}
    </div>
  );
};

export default AdminUsers;
