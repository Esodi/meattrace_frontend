# Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Admin Dashboard                     │
│                    (meattrace_frontend)                      │
│                   http://localhost:3000                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ JWT Token Authentication
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Django REST API                           │
│                   (meattrace_backend)                        │
│                   http://localhost:8000                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                           │
│                      (db.sqlite3)                            │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend (React)

```
App.js (Authentication State)
├── Login.js (Unauthenticated)
└── Authenticated Layout
    ├── Navigation.js (Sidebar + User Info + Logout)
    └── Routes
        ├── Dashboard.js → /api/v2/admin/dashboard/stats/
        ├── UserManagement.js → /api/v2/admin/users/
        ├── ProcessingUnits.js → /api/v2/admin/processing-units/
        └── Shops.js → /api/v2/admin/shops/
```

### API Service Layer

```
services/api.js
├── Axios Instance
│   └── Base URL: http://localhost:8000/api/v2
├── Request Interceptor
│   └── Injects JWT token from localStorage
├── Response Interceptor
│   ├── Handles 401 errors
│   └── Auto-refreshes expired tokens
└── API Methods
    ├── getDashboardStats()
    ├── getUsers(), createUser(), updateUser(), deleteUser()
    ├── getProcessingUnits(), createProcessingUnit(), ...
    └── getShops(), createShop(), updateShop(), deleteShop()
```

### Backend (Django)

```
Django REST Framework
├── Authentication
│   ├── /api/v2/auth/login/ → CustomAuthLoginView
│   └── /api/v2/token/refresh/ → TokenRefreshView
└── Admin Endpoints (JWT Protected)
    ├── /api/v2/admin/dashboard/ → AdminDashboardViewSet
    │   └── /stats/ → Dashboard statistics
    ├── /api/v2/admin/users/ → AdminUserViewSet
    │   └── CRUD operations for users
    ├── /api/v2/admin/processing-units/ → AdminProcessingUnitViewSet
    │   └── CRUD operations for processing units
    └── /api/v2/admin/shops/ → AdminShopViewSet
        └── CRUD operations for shops
```

## Data Flow

### Authentication Flow

```
1. User enters credentials in Login.js
   ↓
2. POST /api/v2/auth/login/
   ↓
3. Django validates credentials
   ↓
4. Returns JWT tokens (access + refresh)
   ↓
5. Frontend stores tokens in localStorage
   ↓
6. Subsequent requests include token in Authorization header
   ↓
7. Token expires after 60 minutes
   ↓
8. Auto-refresh using refresh token (valid for 1 day)
```

### CRUD Operation Flow

```
1. User action in UI (e.g., "Create User")
   ↓
2. Component calls API method (e.g., createUser())
   ↓
3. api.js injects JWT token in request
   ↓
4. POST /api/v2/admin/users/
   ↓
5. Django validates token and permissions
   ↓
6. Django creates record in database
   ↓
7. Returns created object as JSON
   ↓
8. Frontend updates UI with new data
```

### Error Handling Flow

```
1. API request fails
   ↓
2. Is it 401 Unauthorized?
   ├── YES → Try token refresh
   │   ├── Success → Retry original request
   │   └── Failed → Clear storage, redirect to login
   └── NO → Show error message to user
```

## Security Features

### JWT Token Management
- **Access Token**: 60 minutes lifetime
- **Refresh Token**: 1 day lifetime
- **Storage**: localStorage (consider httpOnly cookies for production)
- **Auto-refresh**: On 401 errors

### CORS Configuration
```python
# Django settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Protected Routes
All admin routes require authentication:
- Check for token on app load
- Redirect to login if no valid token
- Auto-logout on token expiry

## Database Schema (Relevant Models)

```
User
├── id (PK)
├── username
├── email
├── first_name
├── last_name
├── is_active
└── UserProfile
    └── role (Abbatoir, Processor, ShopOwner, Admin)

ProcessingUnit
├── id (PK)
├── name
├── location
├── contact_email
├── contact_phone
├── license_number
├── capacity
└── is_active

Shop
├── id (PK)
├── name
├── location
├── contact_email
├── contact_phone
├── license_number
├── business_type (retail, wholesale, restaurant, supermarket)
└── is_active

Animal, Product, Order, Sale (tracked for statistics)
```

## API Response Examples

### Dashboard Stats
```json
{
  "total_users": 45,
  "total_abbatoirs": 20,
  "total_processors": 10,
  "total_shop_owners": 12,
  "total_admins": 3,
  "total_processing_units": 12,
  "active_processing_units": 10,
  "total_shops": 28,
  "active_shops": 25,
  "total_animals": 156,
  "total_products": 89,
  "total_orders": 234,
  "total_sales": 234,
  "recent_animals_count": 23,
  "recent_products_count": 15,
  "recent_orders_count": 45,
  "system_health_status": "healthy",
  "active_alerts_count": 2
}
```

### User List
```json
{
  "results": [
    {
      "id": 1,
      "username": "john_abbatoir",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "abbatoir",
      "is_active": true
    },
    ...
  ]
}
```

## Technology Stack

### Frontend
- **React** 19.2.0 - UI framework
- **React Router** 7.9.5 - Routing
- **Axios** 1.13.2 - HTTP client
- **Framer Motion** 12.23.24 - Animations
- **React Icons** 5.5.0 - Icon library

### Backend
- **Django** 4.2.11 - Web framework
- **Django REST Framework** - API framework
- **djangorestframework-simplejwt** - JWT authentication
- **django-cors-headers** - CORS support

## Environment Variables (Production)

### Frontend (.env)
```
REACT_APP_API_URL=https://your-api-domain.com/api/v2
```

### Backend (environment variables)
```
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

## Performance Considerations

### Current Implementation
- No pagination (works fine for small datasets)
- No caching on frontend
- Direct API calls on every component mount

### Future Optimizations
- Add pagination for large lists
- Implement React Query for caching
- Add optimistic updates
- Lazy load components
- Add debouncing for search
- Implement virtual scrolling for large lists

## Deployment Checklist

### Frontend
- [ ] Update API_BASE_URL to production URL
- [ ] Enable HTTPS
- [ ] Build optimized production bundle
- [ ] Configure CDN for static assets
- [ ] Set up error tracking (e.g., Sentry)

### Backend
- [ ] Set DEBUG=False
- [ ] Configure production database
- [ ] Set up proper CORS origins
- [ ] Enable HTTPS
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring
- [ ] Use httpOnly cookies for tokens

---

This architecture provides a solid foundation for a production-ready admin dashboard with proper separation of concerns, security, and scalability.
