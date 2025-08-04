import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Shop = () => {
  const { user, isAuthenticated, updateUserTickets } = useAuth();
  const { addNotification } = useNotification();

  const shopItems = [
    {
      id: 1,
      name: 'Avatar Légendaire',
      description: 'Un avatar exclusif pour montrer votre statut de légende',
      price: 500,
      category: 'cosmetic',
      icon: '👑',
      rarity: 'legendary'
    },
    {
      id: 2,
      name: 'Boost de Victoire x2',
      description: 'Double les tickets gagnés pendant 24h',
      price: 200,
      category: 'boost',
      icon: '⚡',
      rarity: 'rare'
    },
    {
      id: 3,
      name: 'Badge Elite',
      description: 'Badge premium pour votre profil',
      price: 150,
      category: 'cosmetic',
      icon: '🏅',
      rarity: 'epic'
    },
    {
      id: 4,
      name: 'Titre "Champion"',
      description: 'Titre spécial affiché à côté de votre nom',
      price: 300,
      category: 'cosmetic',
      icon: '🎖️',
      rarity: 'epic'
    },
    {
      id: 5,
      name: 'Protection Anti-Perte',
      description: 'Ne perdez pas vos tickets sur le prochain duel perdu',
      price: 100,
      category: 'boost',
      icon: '🛡️',
      rarity: 'common'
    },
    {
      id: 6,
      name: 'Effet de Victoire',
      description: 'Animation spéciale lors de vos victoires',
      price: 250,
      category: 'cosmetic',
      icon: '✨',
      rarity: 'rare'
    }
  ];

  const [filter, setFilter] = useState('all');
  const [purchasedItems, setPurchasedItems] = useState([]);

  const handlePurchase = (item) => {
    if ((user?.tickets || 0) < item.price) {
      addNotification('Vous n\'avez pas assez de tickets pour cet achat ! 💸', 'error');
      return;
    }

    if (purchasedItems.includes(item.id)) {
      addNotification('Vous possédez déjà cet objet ! 📦', 'warning');
      return;
    }

    // Déduire les tickets
    const newTotal = (user?.tickets || 0) - item.price;
    updateUserTickets(newTotal);
    
    // Ajouter l'objet aux achats
    setPurchasedItems(prev => [...prev, item.id]);
    
    addNotification(`${item.name} acheté avec succès ! ${item.icon}`, 'success');
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-secondary';
      case 'rare': return 'text-primary';
      case 'epic': return 'text-warning';
      case 'legendary': return 'text-danger';
      default: return 'text-muted';
    }
  };

  const getRarityBadge = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-secondary';
      case 'rare': return 'bg-primary';
      case 'epic': return 'bg-warning text-dark';
      case 'legendary': return 'bg-danger';
      default: return 'bg-muted';
    }
  };

  const filteredItems = filter === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === filter);

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <div className="card card-custom p-5">
          <h3 className="text-white mb-3">🔒 Accès restreint</h3>
          <p className="text-muted mb-4">
            Vous devez être connecté pour accéder à la boutique.
          </p>
          <p className="text-warning">
            Connectez-vous pour acheter des objets exclusifs !
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="text-white">🛒 Boutique PlayInBet</h1>
        <div className="d-flex align-items-center">
          <span className="text-muted me-2">Vos tickets :</span>
          <span className="badge bg-warning text-dark fs-6">
            🎫 {user?.tickets || 0}
          </span>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="card card-custom p-3 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('all')}
          >
            🛒 Tous les objets
          </button>
          <button
            className={`btn ${filter === 'cosmetic' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('cosmetic')}
          >
            ✨ Cosmétiques
          </button>
          <button
            className={`btn ${filter === 'boost' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setFilter('boost')}
          >
            ⚡ Boosts
          </button>
        </div>
      </div>

      {/* Shop Stats */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-primary">{shopItems.length}</h4>
            <small className="text-muted">Objets disponibles</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-success">{purchasedItems.length}</h4>
            <small className="text-muted">Objets possédés</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-warning">{user?.tickets || 0}</h4>
            <small className="text-muted">Tickets disponibles</small>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card card-custom text-center p-3">
            <h4 className="text-info">
              {purchasedItems.reduce((total, itemId) => {
                const item = shopItems.find(i => i.id === itemId);
                return total + (item?.price || 0);
              }, 0)}
            </h4>
            <small className="text-muted">Tickets dépensés</small>
          </div>
        </div>
      </div>

      {/* Featured Item */}
      <div className="card card-custom p-4 mb-4" style={{ background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1))' }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <h4 className="text-warning mb-2">⭐ Objet du jour</h4>
            <h5 className="text-white mb-2">👑 Avatar Légendaire</h5>
            <p className="text-muted mb-0">
              Un avatar exclusif pour montrer votre statut de légende. Édition limitée !
            </p>
          </div>
          <div className="col-md-4 text-end">
            <div className="mb-2">
              <span className="badge bg-danger">LÉGENDAIRE</span>
            </div>
            <h4 className="text-warning mb-2">500 🎫</h4>
            <button 
              className="btn btn-warning text-dark"
              onClick={() => handlePurchase(shopItems[0])}
              disabled={purchasedItems.includes(1) || (user?.tickets || 0) < 500}
            >
              {purchasedItems.includes(1) ? '✅ Possédé' : '👑 Acheter'}
            </button>
          </div>
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="row">
        {filteredItems.map((item) => {
          const isPurchased = purchasedItems.includes(item.id);
          const canAfford = (user?.tickets || 0) >= item.price;
          
          return (
            <div key={item.id} className="col-lg-4 col-md-6 mb-4">
              <div className={`card h-100 ${isPurchased ? 'border-success' : 'card-custom'}`}>
                <div className="card-header bg-transparent border-bottom border-secondary d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <span className="me-2" style={{ fontSize: '2rem' }}>
                      {item.icon}
                    </span>
                    <strong className="text-white">{item.name}</strong>
                  </div>
                  <span className={`badge ${getRarityBadge(item.rarity)}`}>
                    {item.rarity.toUpperCase()}
                  </span>
                </div>
                
                <div className="card-body">
                  <p className="text-muted mb-3">{item.description}</p>
                  
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <span className="badge bg-info">
                        {item.category === 'cosmetic' ? '✨ Cosmétique' : '⚡ Boost'}
                      </span>
                    </div>
                    <div className="text-end">
                      <h5 className="text-warning mb-0">
                        🎫 {item.price}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="card-footer bg-transparent border-top border-secondary">
                  {isPurchased ? (
                    <button className="btn btn-success w-100" disabled>
                      ✅ Possédé
                    </button>
                  ) : canAfford ? (
                    <button
                      className="btn btn-primary-custom w-100"
                      onClick={() => handlePurchase(item)}
                    >
                      💳 Acheter
                    </button>
                  ) : (
                    <button className="btn btn-outline-danger w-100" disabled>
                      💸 Tickets insuffisants
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="card card-custom mt-4 p-4">
        <h5 className="text-white mb-3">💡 Comment obtenir plus de tickets ?</h5>
        <div className="row">
          <div className="col-md-3 mb-3">
            <div className="text-center">
              <div className="mb-2">🏆</div>
              <h6 className="text-primary">Gagner des duels</h6>
              <small className="text-muted">Remportez des duels pour doubler votre mise</small>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="text-center">
              <div className="mb-2">🎯</div>
              <h6 className="text-primary">Participer aux tournois</h6>
              <small className="text-muted">Des récompenses importantes en jeu</small>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="text-center">
              <div className="mb-2">💳</div>
              <h6 className="text-primary">Acheter des packs</h6>
              <small className="text-muted">Packs avec bonus dans le portefeuille</small>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="text-center">
              <div className="mb-2">🎁</div>
              <h6 className="text-primary">Récompenses quotidiennes</h6>
              <small className="text-muted">Connectez-vous chaque jour</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;