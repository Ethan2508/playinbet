#!/bin/bash

# Script de démarrage pour PlayInBet
echo "🎮 Démarrage de PlayInBet..."

# Fonction pour démarrer le backend Django
start_backend() {
    echo "🐍 Démarrage du backend Django..."
    cd /Users/ethanharfi/Desktop/playinbet
    
    # Vérifier si l'environnement virtuel existe
    if [ ! -d "venv" ]; then
        echo "📦 Création de l'environnement virtuel..."
        python3 -m venv venv
    fi
    
    # Activer l'environnement virtuel
    source venv/bin/activate
    
    # Installer les dépendances
    echo "📥 Installation des dépendances Python..."
    pip install -r requirements.txt
    
    # Effectuer les migrations
    echo "🗄️ Application des migrations..."
    python manage.py makemigrations
    python manage.py migrate
    
    # Créer un superutilisateur si il n'existe pas
    echo "👤 Vérification du superutilisateur..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser('admin', 'admin@playinbet.com', 'admin123')
    print('Superutilisateur créé: admin/admin123')
else:
    print('Superutilisateur déjà existant')
"
    
    # Démarrer le serveur Django
    echo "🚀 Démarrage du serveur Django sur http://localhost:8000"
    python manage.py runserver &
    DJANGO_PID=$!
}

# Fonction pour démarrer le frontend React
start_frontend() {
    echo "⚛️ Démarrage du frontend React..."
    cd /Users/ethanharfi/Desktop/playinbet/playinbet-frontend
    
    # Installer les dépendances npm
    echo "📥 Installation des dépendances npm..."
    npm install
    
    # Démarrer le serveur React
    echo "🚀 Démarrage du serveur React sur http://localhost:3000"
    npm start &
    REACT_PID=$!
}

# Fonction pour arrêter les serveurs
cleanup() {
    echo "🛑 Arrêt des serveurs..."
    if [ ! -z "$DJANGO_PID" ]; then
        kill $DJANGO_PID 2>/dev/null
    fi
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
    fi
    exit 0
}

# Capturer Ctrl+C pour arrêter proprement
trap cleanup SIGINT

# Démarrer les services
start_backend
sleep 5  # Attendre que Django démarre
start_frontend

echo "✅ PlayInBet est maintenant en cours d'exécution !"
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:8000"
echo "⚙️ Admin Django: http://localhost:8000/admin (admin/admin123)"
echo ""
echo "📋 Comptes de test:"
echo "   - Admin: admin/admin123"
echo "   - Créez de nouveaux comptes via l'interface"
echo ""
echo "🛑 Appuyez sur Ctrl+C pour arrêter les serveurs"

# Attendre que les processus se terminent
wait
