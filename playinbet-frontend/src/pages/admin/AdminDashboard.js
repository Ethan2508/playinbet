import React, { useState, useEffect, useContext } from 'react';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDuels: 0,
    activeDuels: 0,
    completedDuels: 0,
    disputedDuels: 0,
    pendingDisputes: 0,
    totalRevenue: 0,
    todayRegistrations: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Début du chargement des données admin...');
      
      // Récupérer les statistiques réelles depuis l'API
      const [usersResponse, duelsResponse] = await Promise.all([
        api.get('/api/users/').catch(err => {
          console.error('❌ Erreur users API:', err.response?.data || err.message);
          throw err;
        }),
        api.get('/api/duels/').catch(err => {
          console.error('❌ Erreur duels API:', err.response?.data || err.message);
          throw err;
        })
      ]);

      console.log('✅ Réponses API reçues:', {
        users: usersResponse.data.length,
        duels: duelsResponse.data.length
      });

      // Calculer les statistiques
      const totalUsers = usersResponse.data.length;
      const totalDuels = duelsResponse.data.length;
      const activeDuels = duelsResponse.data.filter(d => d.status === 'active' || d.status === 'waiting').length;
      const completedDuels = duelsResponse.data.filter(d => d.status === 'completed').length;
      const disputedDuels = duelsResponse.data.filter(d => d.status === 'disputed').length;
      
      // Calculer le revenu total (somme des mises des duels terminés × 2 pour le pot total)
      const totalRevenue = duelsResponse.data
        .filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (d.amount * 2), 0);

      // Inscriptions d'aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const todayRegistrations = usersResponse.data.filter(u => 
        u.date_joined.startsWith(today)
      ).length;

      const stats = {
        totalUsers,
        totalDuels,
        activeDuels,
        completedDuels,
        disputedDuels,
        pendingDisputes: disputedDuels, // Même valeur pour l'instant
        totalRevenue,
        todayRegistrations
      };

      console.log('📊 Statistiques calculées:', stats);
      setStats(stats);

      // Activité récente basée sur les vrais duels
      const recentDuels = duelsResponse.data
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      const activities = recentDuels.map(duel => {
        if (duel.status === 'disputed') {
          return {
            id: duel.id,
            type: 'dispute',
            message: `Conflit signalé - Duel #${duel.id} (${duel.creator.username} vs ${duel.opponent?.username || 'Adversaire'})`,
            timestamp: new Date(duel.created_at).toLocaleString('fr-FR'),
            severity: 'high'
          };
        } else if (duel.status === 'completed') {
          return {
            id: duel.id,
            type: 'duel',
            message: `Duel #${duel.id} terminé - ${duel.amount * 2} tickets`,
            timestamp: new Date(duel.completed_at || duel.created_at).toLocaleString('fr-FR'),
            severity: 'medium'
          };
        } else {
          return {
            id: duel.id,
            type: 'duel',
            message: `Nouveau duel #${duel.id} créé par ${duel.creator.username}`,
            timestamp: new Date(duel.created_at).toLocaleString('fr-FR'),
            severity: 'low'
          };
        }
      });

      setRecentActivity(activities);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      // Fallback avec données par défaut si erreur
      setStats({
        totalUsers: 0,
        totalDuels: 0,
        activeDuels: 0,
        completedDuels: 0,
        disputedDuels: 0,
        pendingDisputes: 0,
        totalRevenue: 0,
        todayRegistrations: 0
      });
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="col-md-3 mb-4">
      <div className={`card border-0 shadow-sm h-100 border-start border-${color}`} 
           style={{ borderLeftWidth: '4px !important' }}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className={`rounded-circle p-3 bg-${color} bg-opacity-10 me-3`}>
              <i className={`${icon} text-${color} fs-4`}></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="card-title text-muted mb-1">{title}</h6>
              <h3 className="mb-0 fw-bold">{value}</h3>
              {subtitle && <small className="text-muted">{subtitle}</small>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIconByType = (type) => {
      switch (type) {
        case 'dispute': return 'fas fa-exclamation-triangle';
        case 'registration': return 'fas fa-user-plus';
        case 'duel': return 'fas fa-swords';
        default: return 'fas fa-info-circle';
      }
    };

    const getColorByType = (type) => {
      switch (type) {
        case 'dispute': return 'danger';
        case 'registration': return 'success';
        case 'duel': return 'primary';
        default: return 'secondary';
      }
    };

    return (
      <div className="d-flex align-items-center py-3 border-bottom">
        <div className={`rounded-circle p-2 bg-${getColorByType(activity.type)} bg-opacity-10 me-3`}>
          <i className={`${getIconByType(activity.type)} text-${getColorByType(activity.type)}`}></i>
        </div>
        <div className="flex-grow-1">
          <p className="mb-1">{activity.message}</p>
          <small className="text-muted">{new Date(activity.timestamp).toLocaleString('fr-FR')}</small>
        </div>
        {activity.severity === 'high' && (
          <span className="badge bg-danger">Urgent</span>
        )}
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
                <i className="fas fa-crown text-warning me-2"></i>
                Dashboard Admin
              </h2>
              <p className="text-muted mb-0">
                Vue d'ensemble de la plateforme PlayInBet
                {user && (
                  <span className="ms-3">
                    <i className="fas fa-user-shield text-success me-1"></i>
                    {user.username} ({user.role})
                  </span>
                )}
                {!user && (
                  <span className="ms-3 text-danger">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Non connecté
                  </span>
                )}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" onClick={fetchDashboardData}>
                <i className="fas fa-sync-alt me-1"></i>
                Actualiser
              </button>
              <button 
                className="btn btn-info btn-sm" 
                onClick={() => {
                  console.log('🔧 État de l\'auth:', {
                    token: localStorage.getItem('token'),
                    headers: api.defaults.headers.common['Authorization']
                  });
                }}
              >
                <i className="fas fa-bug me-1"></i>
                Debug
              </button>
              <button className="btn btn-primary btn-sm">
                <i className="fas fa-download me-1"></i>
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="row mb-4">
        <StatCard
          title="Utilisateurs Total"
          value={stats.totalUsers.toLocaleString('fr-FR')}
          icon="fas fa-users"
          color="primary"
          subtitle={`+${stats.todayRegistrations} aujourd'hui`}
        />
        <StatCard
          title="Duels Total"
          value={stats.totalDuels.toLocaleString('fr-FR')}
          icon="fas fa-swords"
          color="success"
          subtitle={`${stats.activeDuels} actifs`}
        />
        <StatCard
          title="Conflits en Cours"
          value={stats.pendingDisputes}
          icon="fas fa-exclamation-triangle"
          color="danger"
          subtitle={`${stats.disputedDuels} total disputés`}
        />
        <StatCard
          title="Revenus Total"
          value={`${stats.totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`}
          icon="fas fa-euro-sign"
          color="warning"
          subtitle="Commission plateforme"
        />
      </div>

      {/* Contenu principal */}
      <div className="row">
        {/* Graphiques et métriques */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-transparent border-0 py-3">
              <h5 className="card-title mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Activité des Duels (7 derniers jours)
              </h5>
            </div>
            <div className="card-body">
              {/* Placeholder pour un graphique */}
              <div className="bg-light rounded p-5 text-center">
                <i className="fas fa-chart-area fa-3x text-muted mb-3"></i>
                <p className="text-muted mb-0">Graphique d'activité des duels</p>
                <small className="text-muted">Integration Chart.js à venir</small>
              </div>
            </div>
          </div>

          {/* Métriques détaillées */}
          <div className="row">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <h6 className="card-title mb-0">Répartition des Duels</h6>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>Complétés</span>
                    <span className="badge bg-success">{stats.completedDuels}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span>En cours</span>
                    <span className="badge bg-primary">{stats.activeDuels}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Disputés</span>
                    <span className="badge bg-danger">{stats.disputedDuels}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-transparent border-0 py-3">
                  <h6 className="card-title mb-0">Actions Rapides</h6>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-gavel me-2"></i>
                      Résoudre Conflits
                    </button>
                    <button className="btn btn-outline-success btn-sm">
                      <i className="fas fa-user-shield me-2"></i>
                      Gérer Utilisateurs
                    </button>
                    <button className="btn btn-outline-warning btn-sm">
                      <i className="fas fa-cog me-2"></i>
                      Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-0 py-3">
              <h5 className="card-title mb-0">
                <i className="fas fa-bell me-2"></i>
                Activité Récente
              </h5>
            </div>
            <div className="card-body p-0">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center p-4">
                  <i className="fas fa-inbox fa-2x text-muted mb-3"></i>
                  <p className="text-muted mb-0">Aucune activité récente</p>
                </div>
              )}
            </div>
            <div className="card-footer bg-transparent border-0 py-3">
              <a href="#" className="btn btn-outline-primary btn-sm w-100">
                Voir toute l'activité
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
