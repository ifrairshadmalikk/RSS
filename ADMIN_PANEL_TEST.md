# Admin Panel Test Guide

Follow these steps to verify the admin panel is working correctly after setup.

## Prerequisites
- Server running on http://localhost:5000
- Client running on http://localhost:5173
- MongoDB running locally or on Atlas
- GEMINI_API_KEY configured in server/.env

## Step 1: Verify Admin User Created

**MongoDB Shell Check**:
```bash
mongosh
use global-trend-monitor
db.users.findOne({ email: "admin@trends.local" })
```

Expected output:
```json
{
  "_id": ObjectId(...),
  "name": "Admin",
  "email": "admin@trends.local",
  "role": "admin",
  "password": "$2a$12...",  // hashed
  ...
}
```

✅ **Pass**: If you see `role: "admin"`
❌ **Fail**: If user doesn't exist or role is not "admin"

---

## Step 2: Login as Admin

1. Visit http://localhost:5173/login
2. Enter credentials:
   - Email: `admin@trends.local`
   - Password: `admin123456`
3. Click Sign In
4. You should be redirected to Dashboard
5. Check browser console (DevTools F12):
   ```javascript
   console.log(localStorage.getItem('trend_user'))
   ```
   Should show:
   ```json
   {"id":"...", "name":"Admin", "email":"admin@trends.local", "role":"admin"}
   ```

✅ **Pass**: You're logged in and token shows admin role
❌ **Fail**: 401 error or redirected back to login

---

## Step 3: Navigate to Settings

1. Click **Settings** in navigation (bottom of sidebar)
2. Wait for page to load
3. You should see:
   - **Profile Settings** section (for all users)
   - **User Management** section (admin only)

✅ **Pass**: Both sections visible
❌ **Fail**: Only Profile Settings visible (admin panel not showing)

---

## Step 4: Test Country Dropdown

1. In Settings → Profile Settings → Preferred Countries
2. Click "Select countries..." button
3. A dropdown appears with search box
4. Type "United" in search
5. Should show: United States, United Kingdom
6. Click checkboxes to select countries
7. Selected countries show as tags below
8. Click X on a tag to remove it

✅ **Pass**: Search filters, selections work, tags appear
❌ **Fail**: Dropdown doesn't open or search doesn't filter

---

## Step 5: Test Category Dropdown

1. Scroll to Preferred Categories section
2. Click "Select categories..." button
3. Dropdown opens with search box
4. Type "tech" in search
5. Should show: Technology, Entertainment
6. Select multiple categories
7. Selected categories show as purple tags below
8. Click X on tags to remove

✅ **Pass**: Search filters categories, selections work
❌ **Fail**: Dropdown issues or no filtering

---

## Step 6: Test Admin User Management

1. Scroll to **User Management** section (admin only)
2. You should see a table with columns: Name, Email, Role, Actions
3. Your admin account should be listed
4. The "Role" column shows a dropdown
5. Click the role dropdown for another user (if one exists)
6. You can select: admin, analyst, viewer

**To test fully, create a second user first**:
- Logout
- Go to login page
- Click "Sign Up" tab
- Create a test user account
- Login as admin again
- Go to Settings
- Your new test user should appear in the User Management table

✅ **Pass**: User table shows, role dropdown works, users appear
❌ **Fail**: Table is empty, dropdown doesn't work, shows error

---

## Step 7: Test User Deletion

1. In User Management table, find a test user
2. Click trash icon in Actions column
3. Confirmation dialog appears
4. Click confirm
5. User is removed from table
6. Verify in MongoDB:
   ```bash
   db.users.countDocuments()  # Count should decrease
   ```

✅ **Pass**: User deleted successfully
❌ **Fail**: Error or user still in list

---

## Step 8: Save Profile Changes

1. Edit name or bio in Profile Settings
2. Toggle notifications
3. Select some countries and categories
4. Scroll to bottom and click "Save Changes"
5. Success message appears
6. Reload page (Ctrl+R)
7. Your changes are still there

✅ **Pass**: Changes saved and persist
❌ **Fail**: "Failed to update profile" error or data reset

---

## Step 9: Check API Logs

1. Open browser DevTools (F12)
2. Go to Network tab
3. In Settings page, click "Save Changes"
4. You should see:
   - `PUT /api/profile` → 200 OK (updates your profile)
   - If admin: `GET /api/profile/admin/users` → 200 OK (loads user list)

✅ **Pass**: All APIs return 200
❌ **Fail**: 403 (Insufficient permissions) or 401 (Not authenticated)

---

## Step 10: Verify Gemini AI is Processing

1. Check that articles are being analyzed:
   ```bash
   mongosh
   use global-trend-monitor
   db.articles.findOne({ aiProvider: "gemini" })
   ```

2. Should have fields: `summary`, `keywords`, `sentiment`, `category`, `country`

3. Check AI logs:
   ```bash
   db.ailogs.findOne({ provider: "gemini", status: "success" })
   ```

✅ **Pass**: Articles show Gemini analysis, AI logs show success
❌ **Fail**: Missing fields, aiProvider is not "gemini", or AI logs show errors

---

## Common Issues & Quick Fixes

### Issue: Admin panel not appearing
```javascript
// Clear local storage in browser console
localStorage.clear()
location.reload()
```

### Issue: Role dropdown shows 403 error
```bash
# Re-verify admin user role in database
mongosh
use global-trend-monitor
db.users.updateOne(
  { email: "admin@trends.local" },
  { $set: { role: "admin" } }
)
```

### Issue: Dropdowns not responding
```javascript
// Clear browser cache
// Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Issue: Gemini API errors
```bash
# Verify API key in .env
grep GEMINI_API_KEY server/.env
# Check API key format: should start with "sk-proj-"
```

---

## Success Criteria

✅ All 10 steps complete
✅ Admin user created with role "admin"
✅ Country/category dropdowns work with search
✅ User management table shows and is editable
✅ Profile changes save and persist
✅ Gemini AI is analyzing articles
✅ No 401/403 errors in API calls

---

## Next Steps

1. **Create more users**: Test different roles (analyst, viewer)
2. **Add RSS feeds**: Admin can add RSS feeds to fetch articles
3. **Monitor trends**: Wait 15+ minutes for Gemini to detect trends
4. **Test filtering**: On Trends page, filter by country/category
5. **Check notifications**: Verify breaking news alerts work

For detailed troubleshooting, see: `SETUP_AND_TROUBLESHOOTING.md`
