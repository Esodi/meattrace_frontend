# Quick Setup Guide

## Prerequisites
- Python 3.8+ installed
- Node.js 14+ installed
- Django backend set up

## Backend Setup

1. Navigate to backend directory:
```bash
cd meattrace_backend
```

2. Create a superuser if you haven't already:
```bash
python manage.py createsuperuser
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Start the Django development server:
```bash
python manage.py runserver
```

Backend should now be running on `http://localhost:8000`

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd meattrace_frontend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

Frontend should now be running on `http://localhost:3000`

## Login

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the login page
3. Enter the credentials you created with `createsuperuser`:
   - Username: (your superuser username)
   - Password: (your superuser password)
4. Click "Login"

## What to Expect

After successful login, you should see:
- **Dashboard**: Overview statistics of your system
  - Total users, processing units, shops
  - Total animals, products, and orders
  - Note: Numbers will be 0 if you haven't added any data yet

- **Users Page**: Manage system users
  - Create new users
  - Edit existing users
  - Delete users
  - Assign roles (Abbatoir, Processor, Shop Owner, Admin)

- **Processing Units Page**: Manage meat processing facilities
  - Add new processing units
  - Edit unit details (name, location, license, capacity)
  - Delete units

- **Shops Page**: Manage retail shops
  - Add new shops
  - Edit shop details
  - Delete shops
  - Set business type (Retail, Wholesale, Restaurant, Supermarket)

## Testing the Integration

### 1. Add Test Data via Django Admin (Optional)
```bash
# Visit http://localhost:8000/admin (if admin is enabled in your Django settings)
# Or use the React UI to add data
```

### 2. Create Users
- Go to Users page
- Click "Add New User"
- Fill in the form and save
- You should see the new user in the list

### 3. Create Processing Units
- Go to Processing Units page
- Click "Add New Unit"
- Add details and save

### 4. Create Shops
- Go to Shops page
- Click "Add New Shop"
- Add details and save

### 5. Check Dashboard Updates
- Return to Dashboard
- Numbers should now reflect the data you added

## Troubleshooting

### "Failed to load data" Error
**Problem**: Can't fetch data from backend

**Solutions**:
1. Ensure Django backend is running on port 8000
2. Check browser console for detailed error messages
3. Verify CORS is properly configured in Django settings
4. Make sure you're logged in (check localStorage for 'authToken')

### Can't Login
**Problem**: Login fails with error message

**Solutions**:
1. Verify username and password are correct
2. Check that user exists in Django database
3. Ensure backend is running
4. Check browser console for error details

### Empty Dashboard
**Problem**: Dashboard shows all zeros

**Solution**: This is normal! Add some data:
1. Create users via Users page
2. Create processing units
3. Create shops
4. Dashboard will update automatically

### API Errors
**Problem**: 401, 403, or 500 errors

**Solutions**:
1. **401 Unauthorized**: Token expired, logout and login again
2. **403 Forbidden**: User doesn't have permission
3. **500 Server Error**: Check Django server logs in terminal

## Verifying Backend API

You can test the backend API directly using curl or your browser:

### Check Dashboard Stats
```bash
# First login to get token
curl -X POST http://localhost:8000/api/v2/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Use the returned access token
curl http://localhost:8000/api/v2/admin/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Check Users List
```bash
curl http://localhost:8000/api/v2/admin/users/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Development Tips

### Watch for Changes
Both servers support hot-reloading:
- **React**: Changes in `src/` auto-refresh the browser
- **Django**: Changes in `.py` files auto-restart the server

### Check Logs
- **Django**: Check the terminal where you ran `python manage.py runserver`
- **React**: Check the terminal where you ran `npm start` and browser console

### Database Changes
If you make changes to Django models:
```bash
python manage.py makemigrations
python manage.py migrate
```

## Next Steps

Once everything is working:
1. Add real data to your system
2. Test all CRUD operations
3. Explore the admin dashboard features
4. Consider adding more features like:
   - Analytics charts
   - Export functionality
   - Advanced search/filtering
   - Real-time notifications
