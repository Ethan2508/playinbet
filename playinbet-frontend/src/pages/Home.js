import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [showRematchOffer, setShowRematchOffer] = useState(false);
  const [duelResult, setDuelResult] = useState(null);

  // Vérifier si on revient d'un duel terminé
  useEffect(() => {
    if (location.state?.duelCompleted) {
      setDuelResult(location.state);
      setShowRematchOffer(location.state.canRematch);
      
      // Nettoyer le state après affichage
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const features = [
    {
      icon: '🎮',
      title: 'Défis Gaming',
      description: 'Créez et rejoignez des duels dans 4 catégories : 🏆 Sport (Match foot, Freestyle), 🎮 Compétition (Build Fight, Sniper 1v1), 🚗 Course (Course aérienne), 🎯 Défis (Trick Shot, Speedrun).',
      color: 'var(--primary-color)'
    },
    {
      icon: '🏆',
      title: 'Classements',
      description: 'Grimpez dans les classements et prouvez que vous êtes le meilleur joueur.',
      color: '#ffd700'
    },
    {
      icon: '🎫',
      title: 'Système de tickets',
      description: 'Pariez vos tickets virtuels et gagnez gros dans vos matchs.',
      color: '#ff6b6b'
    },
    {
      icon: '🎯',
      title: 'Tournois',
      description: 'Participez à des tournois organisés et remportez des récompenses.',
      color: '#4ecdc4'
    }
  ];

  const stats = [
    { label: 'Joueurs actifs', value: '15,000+', icon: '👥' },
    { label: 'Duels joués', value: '250,000+', icon: '🎮' },
    { label: 'Tickets distribués', value: '5M+', icon: '🎫' },
    { label: 'Tournois organisés', value: '500+', icon: '🏆' }
  ];

  return (
    <div className="container-fluid p-0">
      {/* Notification de fin de duel */}
      {duelResult && (
        <div className="alert alert-dismissible fade show mb-4" 
             style={{
               backgroundColor: duelResult.result === 'victory' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
               borderColor: duelResult.result === 'victory' ? '#28a745' : '#dc3545',
               color: 'white'
             }}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5>
                {duelResult.result === 'victory' ? '🏆 Victoire !' : '😔 Défaite'} 
                Duel contre {duelResult.opponent}
              </h5>
              <p className="mb-0">
                {duelResult.result === 'victory' 
                  ? 'Félicitations ! Vous avez remporté ce duel.'
                  : 'Pas de chance cette fois. La revanche vous attend !'}
              </p>
            </div>
            {showRematchOffer && (
              <div>
                <button 
                  className="btn btn-outline-light me-2"
                  onClick={() => {/* TODO: Proposer revanche */}}
                >
                  🔄 Revanche
                </button>
              </div>
            )}
          </div>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => setDuelResult(null)}
          ></button>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section text-white text-center py-5 mb-5 fade-in-up"
           style={{
         background: 'linear-gradient(135deg, var(--dark-bg), var(--medium-bg), var(--light-bg))',
         borderRadius: 'var(--border-radius)',
         position: 'relative',
         overflow: 'hidden'
           }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 191, 255, 0.1)',
          borderRadius: 'var(--border-radius)'
        }}></div>
        
        <div className="position-relative" style={{ zIndex: 2 }}>
          <h1 className="display-3 fw-bold mb-4">
        Bienvenue sur{' '}
        <span style={{ color: 'var(--primary-color)' }}>PlayInBet</span>
          </h1>
          
          {isAuthenticated ? (
        <div>
          <h3 className="mb-4">
            Salut <span style={{ color: 'var(--primary-color)' }}>{user?.username?.toUpperCase()}</span> ! 👋
          </h3>
          <p className="lead mb-4">
            Prêt pour de nouveaux défis ? Explore les matchs disponibles et monte dans le classement !
          </p>
          
          <div className="row justify-content-center mb-4">
            <div className="col-md-3 col-6 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-warning">🎫 {user?.tickets || 0}</h4>
            <small>Tickets disponibles</small>
          </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-success">🏆 {user?.victories || 0}</h4>
            <small>Victoires</small>
          </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-info">📊 {user?.rank || 'Débutant'}</h4>
            <small>Rang actuel</small>
          </div>
            </div>
          </div>
          
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/matches" className="btn btn-primary-custom btn-lg">
          🎮 Voir les Matches
            </Link>
            <Link to="/tournaments" className="btn btn-outline-light btn-lg">
          🎯 Tournois
            </Link>
          </div>
        </div>
          ) : (
        <div>
          <p className="lead mb-4">
            La plateforme de gaming compétitif ultime ! Rejoins la compétition et deviens une légende.
          </p>
          <p className="h5 mb-4 text-warning">
            🎁 Obtenez 100 tickets gratuits en vous inscrivant !
          </p>
        </div>
          )}
        </div>
      </div>

        {/* Features Section */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="text-center mb-5 text-white">
            🚀 Pourquoi choisir PlayInBet ?
          </h2>
        </div>
        {features.map((feature, index) => (
          <div key={index} className="col-lg-3 col-md-6 mb-4">
            <div className="card card-custom h-100 text-center p-4">
              <div className="mb-3">
                <span style={{ fontSize: '3rem', color: feature.color }}>
                  {feature.icon}
                </span>
              </div>
              <h5 className="card-title text-white mb-3">{feature.title}</h5>
              <p className="card-text text-muted">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="card card-custom p-4 mb-5">
        <h3 className="text-center mb-4 text-white">📊 Nos Statistiques</h3>
        <div className="row text-center">
          {stats.map((stat, index) => (
            <div key={index} className="col-lg-3 col-md-6 mb-3">
              <div className="p-3">
                <div className="mb-2">
                  <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
                </div>
                <h4 className="text-primary mb-1">{stat.value}</h4>
                <small className="text-muted">{stat.label}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      {!isAuthenticated && (
        <div className="text-center">
          <div className="card card-custom p-5">
            <h3 className="text-white mb-3">Prêt à commencer ?</h3>
            <p className="text-muted mb-4">
              Rejoignez des milliers de joueurs et commencez votre ascension vers le sommet !
            </p>
            <button className="btn btn-primary-custom btn-lg">
              ✨ Rejoindre PlayInBet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;