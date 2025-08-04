# 🚀 Quick Setup Guide - PlayInBet

## Prerequisites
- Python 3.11+
- Node.js 18+
- npm

## 1-Minute Setup

### Backend (Terminal 1)
```bash
cd playinbet
source venv/bin/activate          # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8001
```

### Frontend (Terminal 2)
```bash
cd playinbet/playinbet-frontend
npm install
npm start
```

## Access URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Admin Panel**: http://localhost:8001/admin

## Create Admin User (Optional)
```bash
python manage.py createsuperuser
```

## Test Login
- Register a new user via the frontend
- Or use the admin user you created

## Common Issues
1. **Virtual environment not activated**: Run `source venv/bin/activate`
2. **Port already in use**: Kill processes or use different ports
3. **Database errors**: Run `python manage.py migrate`
4. **Module not found**: Run `pip install -r requirements.txt`

## File Structure (Clean Version)
```
playinbet/
├── Backend (Django on :8001)
├── playinbet-frontend/ (React on :3000)
├── requirements.txt (Python deps)
├── venv/ (Virtual environment)
└── README.md (Full documentation)
```

🎮 **Ready to go!** Both servers should be running and the app accessible.
