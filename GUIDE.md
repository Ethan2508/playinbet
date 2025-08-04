# 🎮 Guide d'Utilisation - PlayInBet

## 🚀 Démarrage Rapide

### Option 1: Script Automatique (Recommandé)
```bash
cd /Users/ethanharfi/Desktop/playinbet
./start_playinbet.sh
```

### Option 2: Démarrage Manuel

#### Backend Django
```bash
cd /Users/ethanharfi/Desktop/playinbet
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend React
```bash
cd /Users/ethanharfi/Desktop/playinbet/playinbet-frontend
npm install
npm start
```

## 🎯 Utilisation de l'Application

### 1. 🏠 Page d'Accueil
- **Sans connexion**: Présentation de la plateforme et incitation à s'inscrire
- **Avec connexion**: Dashboard personnalisé avec statistiques et actions rapides

### 2. 🔐 Authentification
- **Inscription**: Recevez 100 tickets gratuits !
- **Connexion**: Accès à toutes les fonctionnalités
- **Profil**: Visible dans le header avec statistiques

### 3. 🎮 Création de Duels
1. Aller sur "Matches"
2. Cliquer "Créer un Duel"
3. Choisir le jeu (FIFA, COD, Fortnite)
4. Définir la mise en tickets
5. Attendre qu'un adversaire rejoigne

### 4. ⚔️ Rejoindre un Duel
1. Parcourir les duels disponibles
2. Filtrer par jeu si souhaité
3. Cliquer "Rejoindre le duel"
4. Les tickets sont automatiquement déduits

### 5. 🏆 Déclaration de Victoire
- Seuls les participants peuvent déclarer le vainqueur
- Le vainqueur reçoit le double de la mise
- Les victoires sont comptabilisées automatiquement

### 6. 🛒 Boutique
- Acheter des objets cosmétiques avec vos tickets
- Boosts temporaires pour améliorer vos gains
- Système de rareté: Commun → Rare → Épique → Légendaire

### 7. 🎯 Tournois
- Participer à des tournois organisés
- Frais d'entrée variables selon le tournoi
- Gros lots à gagner
- Suivi en temps réel des participants

### 8. 💼 Portefeuille
- Voir vos tickets disponibles
- Historique des transactions
- Acheter des packs de tickets avec bonus
- Statistiques personnelles

### 9. 🏅 Classements
- Classement global par victoires ou tickets
- Voir votre position
- Badges selon les performances
- Système de rangs évolutif

## 💡 Conseils et Astuces

### 💰 Gestion des Tickets
- Commencez par des petites mises (10-25 tickets)
- Économisez pour les gros tournois
- Achetez des packs avec bonus pour optimiser

### 🎮 Stratégie de Jeu
- Concentrez-vous sur un jeu au début
- Participez aux tournois "Rookie" pour débuter
- Utilisez les boosts de la boutique stratégiquement

### 🏆 Progression
- **Débutant**: 0-4 victoires
- **Intermédiaire**: 5-9 victoires  
- **Confirmé**: 10-19 victoires
- **Expert**: 20-49 victoires
- **Légende**: 50+ victoires

## 🔧 Fonctionnalités Avancées

### 🎨 Personnalisation
- Avatars exclusifs dans la boutique
- Titres et badges à débloquer
- Effets de victoire personnalisés

### 📊 Statistiques
- Taux de victoire calculé automatiquement
- Historique complet des duels
- Évolution des tickets dans le temps

### 🛡️ Protections
- Protection anti-perte (achat boutique)
- Validation des mises avant duels
- Système de réclamation pour les litiges

## 🆘 Résolution de Problèmes

### ❌ Problèmes Courants

**"Tickets insuffisants"**
- Vérifiez votre solde dans le header
- Achetez des tickets dans le portefeuille
- Participez à des duels avec mise plus faible

**"Erreur de connexion à l'API"**
- Vérifiez que le backend Django tourne (port 8000)
- Actualisez la page
- Vérifiez votre connexion internet

**"Duel non disponible"**
- Le duel peut être complet
- Un autre joueur l'a peut-être rejoint
- Actualisez la liste des duels

### 🔄 Reset de l'Application
```bash
# Reset complet de la base de données
cd /Users/ethanharfi/Desktop/playinbet
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

## 📱 Interface Mobile

L'application est responsive et fonctionne sur :
- 📱 Smartphones (iOS/Android)
- 📱 Tablettes
- 💻 Ordinateurs desktop
- 🖥️ Écrans larges

## 🎉 Fonctionnalités à Venir

- 🎥 Système de replay des duels
- 💬 Chat en temps réel
- 🎊 Événements saisonniers
- 🤝 Système d'amis
- 📈 Graphiques de progression avancés
- 🎮 Support de nouveaux jeux

## 📞 Support

Pour toute question ou problème :
1. Consultez ce guide d'utilisation
2. Vérifiez les logs dans la console du navigateur
3. Redémarrez l'application avec le script
4. Créez une issue sur le repository GitHub

---

*Amusez-vous bien sur PlayInBet ! 🎮🏆*
