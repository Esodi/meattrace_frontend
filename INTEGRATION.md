# MeatTrace Frontend - Backend Integration

## Overview
This React admin dashboard has been fully integrated with the Django backend API. All mock data has been removed and replaced with real API calls.

## Changes Made

### 1. Authentication System
- **Added Login Component** (`src/components/Login.js`)
  - User authentication via `/api/v2/auth/login/`
  - Token storage in localStorage
  - Error handling for failed login attempts

- **Updated App.js**
  - Authentication state management
  - Protected routes
  - Automatic token validation on app load

### 2. API Integration
All components now use real backend endpoints:

#### Dashboard (`src/components/Dashboard.js`)
- **Endpoint**: `GET /api/v2/admin/dashboard/stats/`
- **Data**: Real-time statistics for users, processing units, shops, animals, products, and orders
- **Mock data removed**: All hardcoded data replaced with API calls

#### User Management (`src/components/UserManagement.js`)
- **List Users**: `GET /api/v2/admin/users/`
- **Create User**: `POST /api/v2/admin/users/`
- **Update User**: `PUT /api/v2/admin/users/{id}/`
- **Delete User**: `DELETE /api/v2/admin/users/{id}/`
- **Mock data removed**: All test users removed

#### Processing Units (`src/components/ProcessingUnits.js`)
- **List Units**: `GET /api/v2/admin/processing-units/`
- **Create Unit**: `POST /api/v2/admin/processing-units/`
- **Update Unit**: `PUT /api/v2/admin/processing-units/{id}/`
- **Delete Unit**: `DELETE /api/v2/admin/processing-units/{id}/`
- **Mock data removed**: All test units removed

#### Shops (`src/components/Shops.js`)
- **List Shops**: `GET /api/v2/admin/shops/`
- **Create Shop**: `POST /api/v2/admin/shops/`
- **Update Shop**: `PUT /api/v2/admin/shops/{id}/`
- **Delete Shop**: `DELETE /api/v2/admin/shops/{id}/`
- **Mock data removed**: All test shops removed

### 3. Enhanced API Service (`src/services/api.js`)
- **Token Management**: Automatic JWT token injection in all requests
- **Token Refresh**: Automatic token refresh on 401 errors
- **Error Handling**: Graceful logout on authentication failures

### 4. Navigation Updates (`src/components/Navigation.js`)
- User information display
- Logout functionality
- User avatar and role display

## Backend Requirements

### Required Django Endpoints
All endpoints are already implemented in the backend. Ensure the following viewsets are registered:

1. **AdminDashboardViewSet** - `/api/v2/admin/dashboard/`
   - `GET /stats/` - Dashboard statistics

2. **AdminUserViewSet** - `/api/v2/admin/users/`
   - Full CRUD operations

3. **AdminProcessingUnitViewSet** - `/api/v2/admin/processing-units/`
   - Full CRUD operations

4. **AdminShopViewSet** - `/api/v2/admin/shops/`
   - Full CRUD operations

5. **Authentication** - `/api/v2/auth/`
   - `POST /login/` - User login
   - `POST /token/refresh/` - Token refresh

### CORS Configuration
Ensure Django settings allow requests from the React frontend:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## Running the Application

### 1. Start the Backend
```bash
cd meattrace_backend
python manage.py runserver
```

### 2. Start the Frontend
```bash
cd meattrace_frontend
npm start
```

### 3. Login
- Navigate to `http://localhost:3000`
- Use your Django admin credentials
- The app will store JWT tokens and maintain session

## Testing the Integration

### 1. Check Backend is Running
Visit: `http://localhost:8000/api/v2/admin/dashboard/stats/`
- Should return JSON with dashboard statistics

### 2. Test Authentication
- Try logging in with invalid credentials (should show error)
- Login with valid Django user credentials
- Check browser localStorage for tokens

### 3. Test CRUD Operations
- **Users**: Create, edit, delete users
- **Processing Units**: Manage processing units
- **Shops**: Manage shops
- All operations should update the backend database

## Error Handling

The application now includes comprehensive error handling:

1. **Network Errors**: Shows user-friendly message when backend is unreachable
2. **Authentication Errors**: Automatically redirects to login on token expiry
3. **Validation Errors**: Displays backend validation messages
4. **CRUD Errors**: Shows specific error messages for failed operations

## Security Features

1. **JWT Authentication**: All API requests include Bearer token
2. **Token Refresh**: Automatic token refresh without user intervention
3. **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
4. **Protected Routes**: All routes require authentication

## Next Steps

### Optional Enhancements:
1. **Analytics Charts**: Connect real analytics data to chart components
2. **Real-time Updates**: Add WebSocket support for live data
3. **Advanced Filtering**: Implement search and filter for all lists
4. **Export Features**: Add CSV/PDF export functionality
5. **Notifications**: Add real-time notification system
6. **Audit Logs**: Display user activity logs

## Troubleshooting

### "Failed to load data" errors
- Ensure backend is running on `http://localhost:8000`
- Check CORS settings in Django
- Verify you're logged in with valid credentials

### Authentication issues
- Clear browser localStorage
- Check token expiry settings in Django
- Verify JWT settings in `settings.py`

### API endpoint not found
- Run `python manage.py show_urls` to verify endpoints
- Check router registration in `urls.py`
- Ensure viewsets are properly imported

## Production Deployment

Before deploying to production:

1. Update `API_BASE_URL` in `src/services/api.js` to production URL
2. Enable HTTPS for all API calls
3. Implement httpOnly cookies instead of localStorage for tokens
4. Add rate limiting on backend
5. Enable proper CORS settings (remove `CORS_ALLOW_ALL_ORIGINS`)
6. Add monitoring and error tracking (e.g., Sentry)
