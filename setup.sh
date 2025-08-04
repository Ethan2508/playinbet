#!/bin/bash

# PlayInBet - Developer Setup Script
echo "🎮 PlayInBet - Setting up development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3.11+ first.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python and Node.js are installed${NC}"

# Setup Backend
echo -e "${BLUE}🐍 Setting up Django backend...${NC}"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Setting up database..."
python manage.py makemigrations
python manage.py migrate

# Setup Frontend
echo -e "${BLUE}⚛️ Setting up React frontend...${NC}"
cd playinbet-frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

cd ..

# Create superuser prompt
echo -e "${YELLOW}📋 Setup complete!${NC}"
echo ""
echo "To create an admin user (optional):"
echo "  source venv/bin/activate"
echo "  python manage.py createsuperuser"
echo ""
echo "To start the servers:"
echo "  Terminal 1: source venv/bin/activate && python manage.py runserver 8001"
echo "  Terminal 2: cd playinbet-frontend && npm start"
echo ""
echo "Access URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8001"
echo "  Admin:    http://localhost:8001/admin"
echo ""
echo -e "${GREEN}🚀 Ready for development!${NC}"
