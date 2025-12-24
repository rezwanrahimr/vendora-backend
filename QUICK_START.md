# 🚀 Quick Start - Next Steps

## Immediate Actions Required

### 1. Run Database Migration (REQUIRED)

```bash
# Navigate to project directory
cd e:\yasminaarsic-server

# Run migration
npx prisma migrate dev --name add_push_notifications

# Generate Prisma client
npx prisma generate
```

**This creates:**
- `fcmTokens` and `lastActiveAt` columns in User table
- New `PushNotification` table
- New notification enums

---

### 2. Configure Firebase (REQUIRED)

#### Get Firebase Credentials:

1. Visit: https://console.firebase.google.com/
2. Select your project (or create new one)
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate New Private Key"**
5. Download the JSON file

#### Update .env file:

Open your `.env` file and add:

```bash
# Firebase Cloud Messaging
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important:** 
- Keep quotes around FIREBASE_PRIVATE_KEY
- Preserve the `\n` characters
- Never commit .env to git

#### Restart Server:

```bash
npm run start:dev
```

**Check logs for:**
```
[FirebaseService] Firebase Admin SDK initialized successfully
```

---

### 3. Share with Mobile Team

Send these files to your mobile developers:

📄 **FCM_MOBILE_INTEGRATION_GUIDE.md** - Complete mobile integration guide

Also provide:
- Firebase project ID
- Firebase configuration files:
  - `google-services.json` (Android)
  - `GoogleService-Info.plist` (iOS)
- API base URL
- Test user credentials

---

## Quick Test

### Test 1: Register FCM Token

```bash
# Login first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "yourpassword"
  }'

# Register FCM token
curl -X POST http://localhost:3000/api/v1/users/fcm-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-fcm-token-123",
    "platform": "ANDROID"
  }'
```

### Test 2: Check Swagger UI

Visit: http://localhost:3000/api-docs

Look for:
- **Users** section: New FCM token endpoints
- **Notifications** section: All notification APIs

---

## Files to Review

### Backend Setup:
📄 **FIREBASE_SETUP_GUIDE.md** - Complete backend documentation

### Mobile Team:
📄 **FCM_MOBILE_INTEGRATION_GUIDE.md** - Mobile integration guide

### Summary:
📄 **FIREBASE_IMPLEMENTATION_SUMMARY.md** - What was implemented

### Environment:
📄 **.env.firebase.example** - Firebase credentials template

---

## Troubleshooting

### Issue: Firebase not configured warning

**Solution:** Add Firebase credentials to `.env` and restart server

### Issue: Migration fails with drift error

**Solution:** 
```bash
# Check migration status
npx prisma migrate status

# If needed, reset and migrate
npx prisma migrate reset
npx prisma migrate dev --name add_push_notifications
```

### Issue: Notifications not sending

**Checklist:**
- ✅ Firebase credentials in .env
- ✅ Server restarted
- ✅ Migration completed
- ✅ FCM token registered
- ✅ User has newOffer preference enabled

---

## What's Next?

After completing steps 1-3 above:

1. **Mobile team** implements Firebase SDK
2. **Mobile team** registers FCM tokens via API
3. **Test** end-to-end notification flow
4. **Create** new offers to trigger notifications
5. **Verify** notifications received on real devices
6. **Monitor** notification delivery in database

---

## Support

For questions or issues:

1. Check **FIREBASE_SETUP_GUIDE.md** for detailed setup
2. Review **FIREBASE_IMPLEMENTATION_SUMMARY.md** for overview
3. Check server logs for errors
4. Verify Firebase Console for project status

---

## Quick Reference

### Key Endpoints:
```
POST   /api/v1/users/fcm-token                    # Register token
DELETE /api/v1/users/fcm-token                    # Remove token
GET    /api/v1/notifications                      # Get notifications
GET    /api/v1/notifications/unread-count         # Get unread count
PATCH  /api/v1/notifications/:id/read             # Mark as read
DELETE /api/v1/notifications/:id                  # Delete notification
PATCH  /api/v1/users/notification-preferences     # Update preferences
```

### Environment Variables:
```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### Migration Command:
```bash
npx prisma migrate dev --name add_push_notifications
npx prisma generate
```

---

**That's it! You're ready to go! 🎉**

Start with step 1 (database migration) and you'll be sending push notifications in minutes!
