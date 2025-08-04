# PlayInBet - Gaming Duel Platform

A comprehensive gaming duel platform built with Django REST Framework (backend) and React (frontend). Users can create gaming duels, participate in tournaments, manage their wallet, and complete KYC verification.

## 🚀 Project Overview

PlayInBet is a competitive gaming platform where users can:
- Create and participate in gaming duels across 25+ game modes
- Complete KYC verification for enhanced features
- Manage tickets and wallet transactions
- Participate in tournaments and view leaderboards
- Admin panel for platform management

## 🛠 Tech Stack

### Backend
- **Django 5.1.6** - Web framework
- **Django REST Framework** - API development
- **Djoser** - Authentication system
- **SQLite/PostgreSQL** - Database
- **Python 3.11+** - Programming language

### Frontend
- **React 18** - UI framework
- **React Router v6** - Navigation
- **Bootstrap 5** - UI components
- **Axios** - HTTP client
- **Context API** - State management

## 📁 Project Structure

```
playinbet/
├── 🐍 BACKEND (Django)
│   ├── core/                     # Main app
│   │   ├── models.py            # Database models
│   │   ├── views.py             # API views
│   │   ├── serializers.py       # API serializers
│   │   └── urls.py              # API routes
│   ├── playinbet_backend/       # Django settings
│   ├── manage.py               # Django management
│   ├── db.sqlite3              # Database file
│   └── venv/                   # Python virtual environment
│
└── ⚛️ FRONTEND (React)
    └── playinbet-frontend/
        ├── src/
        │   ├── components/      # Reusable components
        │   │   ├── Sidebar.js          # Main navigation
        │   │   ├── LoginForm.js        # Authentication
        │   │   ├── CreateDuelForm.js   # Duel creation
        │   │   └── KYCVerificationModal.js
        │   ├── pages/          # Main pages
        │   │   ├── Home.js             # Landing page
        │   │   ├── Matches.js          # Duels management
        │   │   ├── DuelRoom.js         # Active duel interface
        │   │   ├── Tournaments.js      # Tournament system
        │   │   ├── Wallet.js           # Financial management
        │   │   ├── Profile.js          # User profile
        │   │   └── admin/              # Admin pages
        │   ├── context/        # React contexts
        │   │   ├── AuthContext.js      # Authentication state
        │   │   └── NotificationContext.js
        │   ├── hooks/          # Custom hooks
        │   │   ├── useKYC.js           # KYC verification
        │   │   └── useDuelRedirect.js
        │   └── api/            # API configuration
        │       └── axios.js            # HTTP client setup
        ├── public/             # Static assets
        └── package.json        # Dependencies
```

## 🔧 Installation & Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **npm** or **yarn**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd playinbet
```

### 2. Backend Setup (Django)

#### Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # Create admin user
```

#### Start Backend Server
```bash
python manage.py runserver 8001
```
Backend will be available at: `http://localhost:8001`

### 3. Frontend Setup (React)

#### Navigate to Frontend Directory
```bash
cd playinbet-frontend
```

#### Install Dependencies
```bash
npm install
```

#### Start Frontend Server
```bash
npm start
```
Frontend will be available at: `http://localhost:3000`

## 🌐 API Endpoints

### Authentication
- `POST /auth/token/login/` - User login
- `POST /auth/token/logout/` - User logout
- `POST /auth/users/` - User registration
- `GET /auth/users/me/` - Current user info

### Core Features
- `GET/POST /api/duels/` - Duel management
- `GET/POST /api/tournaments/` - Tournament system
- `GET/POST /api/kyc/` - KYC verification
- `GET/POST /api/withdrawals/` - Wallet management
- `GET /api/admin/` - Admin endpoints

## 🎮 Key Features

### 1. Gaming Duels
- **25+ Game Modes**: Fortnite, Call of Duty, FIFA, etc.
- **Real-time Duel Creation**: Instant matchmaking
- **Proof Upload System**: Screenshot validation
- **AI Validation**: Automated result verification
- **Dispute Resolution**: Admin-managed conflicts

### 2. KYC Verification System
- **Identity Verification**: Document upload
- **Enhanced Security**: Required for transactions
- **Status Tracking**: Real-time verification updates
- **Admin Review**: Manual verification process

### 3. Wallet Management
- **Ticket System**: Virtual currency
- **Secure Transactions**: Bank integration
- **Withdrawal System**: IBAN-based payouts
- **Transaction History**: Complete audit trail

### 4. Tournament System
- **Multi-format Tournaments**: Various competition types
- **Leaderboards**: Real-time rankings
- **Prize Distribution**: Automated rewards
- **Bracket Management**: Tournament progression

### 5. Admin Panel
- **User Management**: Account administration
- **Duel Oversight**: Match supervision
- **Financial Control**: Transaction monitoring
- **Platform Settings**: System configuration

## 🔒 Authentication & Security

### Token-Based Authentication
- Uses Django's token authentication
- Secure API endpoints
- Session management
- Role-based access control

### KYC Integration
- Document verification
- Identity validation
- Enhanced security features
- Regulatory compliance

## 🎨 UI/UX Features

### Design System
- **Glass Morphism**: Modern dark theme
- **Responsive Design**: Mobile-first approach
- **Bootstrap 5**: Consistent components
- **Interactive Elements**: Smooth animations

### User Experience
- **Real-time Notifications**: Instant feedback
- **Progressive Loading**: Optimized performance
- **Intuitive Navigation**: User-friendly interface
- **Error Handling**: Graceful error management

## 🐛 Known Issues & Improvements

### Current Bugs (for developer attention)
1. **Minor UI inconsistencies** in mobile view
2. **Notification timing** optimization needed
3. **Image upload** validation enhancement
4. **Real-time updates** frequency adjustment

### Suggested Improvements
1. **WebSocket integration** for real-time features
2. **Enhanced caching** for better performance
3. **Advanced filtering** in admin panels
4. **Automated testing** implementation

## 📊 Database Schema

### Key Models
- **User**: Extended Django user model
- **Duel**: Gaming match entity
- **Tournament**: Competition structure
- **KYCVerification**: Identity validation
- **Withdrawal**: Financial transactions
- **Notification**: System messaging

## 🚀 Deployment Notes

### Production Considerations
- Switch to **PostgreSQL** for production
- Configure **environment variables**
- Set up **static file serving**
- Enable **HTTPS** and security headers
- Configure **email backend**

### Environment Variables
```bash
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://...
ALLOWED_HOSTS=yourdomain.com
```

## 📝 Development Guidelines

### Code Structure
- Clean, modular architecture
- Consistent naming conventions
- Proper error handling
- Comprehensive comments

### Best Practices
- Use TypeScript for enhanced development
- Implement proper testing
- Follow React/Django conventions
- Maintain security standards

## 🤝 Contributing

1. Follow existing code patterns
2. Write clear commit messages
3. Test thoroughly before deployment
4. Update documentation as needed

## 📞 Support

For technical issues or questions:
- Review the codebase structure
- Check API endpoint documentation
- Test in development environment
- Monitor console/server logs

---

**Project Status**: ✅ Fully Functional  
**Last Updated**: August 2025  
**Ready for**: Bug fixes and feature enhancements
