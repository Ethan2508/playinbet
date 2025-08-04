# 🔧 Technical Documentation - PlayInBet

## Architecture Overview

### Backend (Django REST API)
- **Framework**: Django 5.1.6 + Django REST Framework
- **Authentication**: Token-based (Djoser)
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **API Prefix**: `/api/` for all endpoints

### Frontend (React SPA)  
- **Framework**: React 18 with functional components
- **State Management**: Context API (Auth, Notifications, KYC)
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **UI Framework**: Bootstrap 5 + custom CSS

## Key Components Analysis

### 🔐 Authentication Flow
1. **Login**: `POST /auth/token/login/` → Token stored in localStorage
2. **Auto-login**: Token validation on app load
3. **Protected Routes**: ProtectedRoute wrapper component
4. **Admin Routes**: AdminRoute with role validation

### 🎮 Duel System
- **Creation**: CreateDuelForm component
- **Management**: Matches page with real-time updates
- **Room**: DuelRoom for active matches
- **Validation**: Screenshot upload + AI validation

### 🏦 KYC Integration
- **Modal**: KYCVerificationModal component
- **Hook**: useKYC for status management
- **Validation**: Document upload system
- **Admin Review**: Manual verification process

### 💰 Wallet System
- **Tickets**: Virtual currency system
- **Transactions**: Complete audit trail
- **Withdrawals**: IBAN validation + admin approval
- **Integration**: Connected to duel winnings

## Database Models

### Core Models
```python
# User (Extended Django User)
- username, email, password
- tickets (IntegerField)
- is_admin (BooleanField)
- created_at, updated_at

# Duel
- creator, opponent (ForeignKey to User)
- game_mode, bet_amount
- status (pending, active, completed, disputed)
- proof_creator, proof_opponent (ImageField)
- winner (ForeignKey to User, nullable)

# KYCVerification
- user (OneToOneField)
- is_verified (BooleanField)
- document_front, document_back (ImageField)
- verification_status (pending, approved, rejected)

# Tournament
- name, description
- start_date, end_date
- entry_fee, prize_pool
- participants (ManyToManyField)

# Withdrawal
- user (ForeignKey)
- amount_tickets, amount_euros
- bank_iban, bank_bic
- status (pending, approved, rejected)
```

## API Endpoints Reference

### Authentication
```
POST /auth/token/login/     # Login
POST /auth/token/logout/    # Logout  
POST /auth/users/           # Register
GET  /auth/users/me/        # Current user
```

### Core Features
```
GET    /api/duels/              # List duels
POST   /api/duels/              # Create duel
GET    /api/duels/{id}/         # Duel details
PUT    /api/duels/{id}/         # Update duel
DELETE /api/duels/{id}/         # Delete duel

GET    /api/tournaments/        # List tournaments
POST   /api/tournaments/        # Create tournament

GET    /api/kyc/status/         # KYC status
POST   /api/kyc/submit/         # Submit KYC

GET    /api/withdrawals/        # List withdrawals
POST   /api/withdrawals/        # Create withdrawal
```

### Admin Endpoints
```
GET /api/admin/users/           # User management
GET /api/admin/duels/           # Duel oversight
GET /api/admin/conflicts/       # Dispute resolution
GET /api/admin/settings/        # Platform settings
```

## Frontend State Management

### AuthContext
```javascript
{
  user: User | null,
  token: string | null,
  loading: boolean,
  isAuthenticated: boolean,
  login: (username, password) => Promise,
  logout: () => void,
  updateUserTickets: (newTickets) => void
}
```

### KYCContext
```javascript
{
  kycStatus: KYCStatus | null,
  loading: boolean,
  showKYCModal: boolean,
  requiresKYC: () => boolean,
  setShowKYCModal: (show) => void
}
```

### NotificationContext
```javascript
{
  showNotification: (message, type, duration) => void,
  notifications: Notification[]
}
```

## Security Implementation

### Backend Security
- CORS configuration for frontend origin
- Token authentication with expiration
- Admin-only endpoints protection
- File upload validation
- SQL injection protection (Django ORM)

### Frontend Security
- Token stored in localStorage (consider httpOnly cookies for production)
- Protected routes with authentication checks
- Admin route protection
- Input validation and sanitization
- HTTPS enforcement (production)

## Performance Optimizations

### Backend
- Database indexing on frequently queried fields
- Pagination for list endpoints
- Optimized serializers
- Static file serving configuration

### Frontend
- Component lazy loading
- Image optimization
- Axios request/response interceptors
- Efficient re-rendering with React hooks
- Bootstrap bundle optimization

## File Upload System

### Screenshot Validation
- Accepted formats: JPG, PNG, WebP
- Max file size: 5MB
- Server-side validation
- Unique filename generation
- Storage in media/ directory

### KYC Documents
- Identity document upload
- Frontend validation
- Secure storage
- Admin review interface

## Real-time Features

### Current Implementation
- Manual refresh intervals (15s for duels)
- Notification system for user feedback
- Auto-refresh on user actions

### Future Enhancements
- WebSocket integration for real-time updates
- Push notifications
- Live duel status updates
- Real-time chat in duel rooms

## Testing Strategy

### Backend Testing
```bash
python manage.py test
```

### Frontend Testing
```bash
npm test
```

### Manual Testing Checklist
- [ ] User registration/login flow
- [ ] Duel creation and participation
- [ ] KYC verification process
- [ ] Wallet transactions
- [ ] Admin panel functionality
- [ ] Mobile responsiveness

## Deployment Considerations

### Environment Variables
```bash
# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgresql://...

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password
```

### Production Setup
1. Switch to PostgreSQL database
2. Configure static file serving (Nginx/Apache)
3. Set up SSL certificates
4. Configure email backend
5. Implement backup strategy
6. Set up monitoring and logging

## Common Development Tasks

### Adding New API Endpoint
1. Create view in `core/views.py`
2. Add serializer in `core/serializers.py`
3. Update URL patterns in `core/urls.py`
4. Test endpoint functionality

### Adding New React Page
1. Create component in `src/pages/`
2. Add route in `App.js`
3. Update navigation in `Sidebar.js`
4. Implement required API calls

### Database Schema Changes
```bash
python manage.py makemigrations
python manage.py migrate
```

## Code Quality Standards

### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where applicable
- Comprehensive error handling
- Docstrings for functions/classes

### JavaScript (Frontend)
- ES6+ features
- Functional components with hooks
- Consistent naming conventions
- PropTypes or TypeScript for type safety

---

**Last Updated**: August 2025  
**Technical Debt**: Minimal - Clean codebase ready for enhancement
