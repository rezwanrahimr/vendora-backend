# Firebase Push Notifications - Backend Setup Guide

## Overview

This project now includes Firebase Cloud Messaging (FCM) integration for sending real-time push notifications to mobile users. This guide will help you set up and configure the notification system.

---

## What's Been Implemented

### 1. Database Schema Updates
- Added `fcmTokens` field to User model (stores array of device tokens with metadata)
- Added `lastActiveAt` field to track user activity
- Created `PushNotification` model to store notification history
- Added notification types: `NEW_OFFER`, `RENEWAL_REMINDER`, `PROMOTIONAL`, `VENDOR_APPROVED`, `SYSTEM`
- Added notification statuses: `PENDING`, `SENT`, `FAILED`, `READ`

### 2. New Notification Module
- **FirebaseService**: Initializes Firebase Admin SDK and handles FCM messaging
- **PushNotificationService**: Core service for sending notifications, managing tokens, and tracking history
- **NotificationController**: REST API endpoints for notification management

### 3. API Endpoints

#### FCM Token Management (Users)
- `POST /api/v1/users/fcm-token` - Register device token
- `DELETE /api/v1/users/fcm-token` - Remove device token

#### Notification Management
- `GET /api/v1/notifications` - Get paginated notification history
- `GET /api/v1/notifications/unread-count` - Get unread count for badge
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read
- `DELETE /api/v1/notifications/:id` - Delete notification

#### Notification Preferences (Existing)
- `PATCH /api/v1/users/notification-preferences` - Update opt-in/opt-out preferences

### 4. Business Logic Integration
- **New Offer Created**: Automatically sends push notifications to all active users who have opted in for new offer notifications
- **Extensible**: Ready to add notifications for vendor approval, subscription renewals, etc.

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

This will install the new `firebase-admin` package (v12.7.0) added to package.json.

### Step 2: Run Database Migration

```bash
npx prisma migrate dev --name add_push_notifications
```

This creates the new database schema with:
- `fcmTokens` and `lastActiveAt` columns in User table
- New `PushNotification` table
- New enums for notification types and statuses

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

This regenerates the Prisma client with the new schema changes.

### Step 4: Configure Firebase

#### 4.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Add your mobile apps (iOS/Android) to the project

#### 4.2 Get Service Account Credentials

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Download the JSON file

#### 4.3 Extract Credentials

From the downloaded JSON file, extract:
- `project_id`
- `private_key`
- `client_email`

#### 4.4 Update Environment Variables

Add these to your `.env` file:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- Keep the quotes around `FIREBASE_PRIVATE_KEY`
- Preserve the `\n` characters for newlines
- Never commit the `.env` file to version control

See `.env.firebase.example` for reference.

### Step 5: Restart the Server

```bash
npm run start:dev
```

The Firebase service will initialize on startup. Check logs for:
```
[FirebaseService] Firebase Admin SDK initialized successfully
```

If Firebase credentials are missing, you'll see a warning:
```
[FirebaseService] Firebase credentials not configured. Push notifications will not work.
```

---

## Testing the Integration

### 1. Check API Documentation

Start the server and visit: `http://localhost:3000/api-docs`

You'll see new endpoints under:
- **Users** section: FCM token management
- **Notifications** section: Notification APIs

### 2. Test FCM Token Registration

```bash
# Login first to get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Register FCM token
curl -X POST http://localhost:3000/api/v1/users/fcm-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test-fcm-token-123",
    "platform": "ANDROID",
    "deviceId": "test-device-001"
  }'
```

### 3. Test Notification Sending

Create a new offer (as a vendor) and check if notifications are sent to users:

```bash
# Create offer
curl -X POST http://localhost:3000/api/v1/offer \
  -H "Authorization: Bearer VENDOR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test BOGO Offer",
    "description": "Buy one get one free!",
    "type": "BOGO",
    "vendorId": "vendor-uuid",
    "validUntil": "2025-12-31T23:59:59Z"
  }'
```

Check server logs for:
```
Sending notifications to X users for new offer
```

### 4. Verify Notification History

```bash
# Get user's notifications
curl -X GET http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get unread count
curl -X GET http://localhost:3000/api/v1/notifications/unread-count \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Test Notification Preferences

```bash
# Disable new offer notifications
curl -X PATCH http://localhost:3000/api/v1/users/notification-preferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newOffer": false,
    "renewalReminder": true,
    "promotional": true
  }'
```

---

## Mobile App Integration

### For Mobile Developers

Share the following documentation with your mobile development team:

**📄 FCM_MOBILE_INTEGRATION_GUIDE.md**

This comprehensive guide includes:
- Firebase SDK setup for iOS/Android/React Native
- FCM token registration flow
- API endpoint documentation with examples
- Notification payload structure
- Deep linking implementation
- Testing guide
- Error handling
- Best practices

### Quick Start for Mobile Team

1. **Setup Firebase in mobile app**
   - Add google-services.json (Android) or GoogleService-Info.plist (iOS)
   - Install Firebase SDK dependencies

2. **Obtain FCM token** from Firebase SDK

3. **Register token** with backend:
   ```
   POST /api/v1/users/fcm-token
   Body: { "token": "...", "platform": "ANDROID" }
   ```

4. **Handle incoming notifications** and deep link to appropriate screens

5. **Test end-to-end** flow with real devices

---

## Architecture Overview

```
┌─────────────────┐
│  Mobile App     │
│  (iOS/Android)  │
└────────┬────────┘
         │ FCM Token
         ▼
┌─────────────────────────────────┐
│  Backend API                    │
│                                 │
│  ┌──────────────────────────┐  │
│  │ UsersController          │  │
│  │ - POST /fcm-token        │  │
│  │ - DELETE /fcm-token      │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ NotificationController   │  │
│  │ - GET /notifications     │  │
│  │ - PATCH /:id/read        │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │ PushNotificationService  │  │
│  │ - sendToUser()           │  │
│  │ - sendToMultipleUsers()  │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────▼───────────────┐  │
│  │ FirebaseService          │  │
│  │ - sendToDevice()         │  │
│  │ - sendToMultipleDevices()│  │
│  └──────────┬───────────────┘  │
└─────────────┼───────────────────┘
              │
              ▼
     ┌──────────────────┐
     │ Firebase Cloud   │
     │ Messaging (FCM)  │
     └────────┬─────────┘
              │
              ▼
     ┌──────────────────┐
     │  Mobile Device   │
     │  (Push Notify)   │
     └──────────────────┘
```

---

## Notification Flow

### When New Offer is Created:

1. **Vendor creates offer** via API
2. **OfferService.createOffer()** saves offer to database
3. **sendNewOfferNotifications()** runs in background:
   - Queries all active users with `newOffer: true` preference
   - Filters users who have FCM tokens
   - Calls `PushNotificationService.sendToMultipleUsers()`
4. **PushNotificationService** for each user:
   - Creates notification record in database
   - Retrieves user's FCM tokens
   - Calls `FirebaseService.sendToMultipleDevices()`
5. **FirebaseService** sends message via Firebase Admin SDK
6. **FCM** delivers notification to user's device(s)
7. **Invalid tokens** are automatically removed from database

---

## Extending the System

### Add New Notification Type

1. **Update enum** in [prisma/schema.prisma](prisma/schema.prisma):
```prisma
enum NotificationType {
  NEW_OFFER
  RENEWAL_REMINDER
  PROMOTIONAL
  VENDOR_APPROVED
  SYSTEM
  YOUR_NEW_TYPE  // Add here
}
```

2. **Update DTO** in [src/modules/notification/dto/notification-query.dto.ts](src/modules/notification/dto/notification-query.dto.ts)

3. **Add trigger logic** in appropriate service

4. **Run migration**:
```bash
npx prisma migrate dev --name add_new_notification_type
```

### Send Custom Notification

```typescript
import { PushNotificationService } from './modules/notification/push-notification.service';
import { NotificationType } from './modules/notification/dto';

// Inject service
constructor(private pushNotificationService: PushNotificationService) {}

// Send notification
await this.pushNotificationService.sendToUser(userId, {
  title: 'Custom Title',
  body: 'Custom message body',
  type: NotificationType.SYSTEM,
  data: {
    customField: 'value',
    screen: 'CustomScreen'
  }
});
```

---

## Monitoring and Debugging

### Check Firebase Service Status

```typescript
// In any service
@Inject(FirebaseService)
private firebaseService: FirebaseService;

const messaging = this.firebaseService.getMessaging();
if (!messaging) {
  console.log('Firebase not configured');
}
```

### View Notification Logs

Check database for notification delivery status:

```sql
-- See all notifications
SELECT * FROM "PushNotification" ORDER BY "createdAt" DESC LIMIT 10;

-- Count by status
SELECT status, COUNT(*) 
FROM "PushNotification" 
GROUP BY status;

-- See failed notifications
SELECT * FROM "PushNotification" 
WHERE status = 'FAILED';
```

### Common Issues

1. **"Firebase not configured" warning**
   - Check `.env` file has all three Firebase variables
   - Verify private key format (with quotes and \n)
   - Restart server after adding credentials

2. **Notifications not received on device**
   - Verify FCM token is registered in database
   - Check user's notification preferences
   - Verify Firebase project settings
   - Test with Firebase Console test message

3. **Invalid token errors**
   - These are automatically handled and removed
   - Implement token refresh in mobile app

---

## Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **Firebase Credentials**: Store securely, rotate periodically
3. **Token Validation**: Backend validates token ownership
4. **Rate Limiting**: Consider adding rate limits for notification sending
5. **User Preferences**: Always respect user's notification preferences

---

## Performance Optimization

### Current Implementation:
- ✅ Notifications sent asynchronously (non-blocking)
- ✅ Batch sending to multiple devices
- ✅ Automatic invalid token cleanup
- ✅ Database indexes on userId and createdAt

### Future Improvements:
- Add job queue (Bull/BullMQ) for reliable delivery
- Implement retry logic for failed notifications
- Add notification scheduling
- Cache user preferences
- Add analytics and delivery tracking

---

## Support

For issues or questions:

1. Check logs for Firebase initialization errors
2. Verify database migrations ran successfully
3. Test FCM token registration via Swagger UI
4. Review mobile app Firebase configuration
5. Test with Firebase Console direct message

---

## Next Steps

- [ ] Configure Firebase credentials in production
- [ ] Set up Firebase project for iOS app
- [ ] Set up Firebase project for Android app
- [ ] Share FCM_MOBILE_INTEGRATION_GUIDE.md with mobile team
- [ ] Test end-to-end notification flow
- [ ] Set up monitoring and alerts
- [ ] Configure notification scheduling (optional)
- [ ] Add admin panel for sending broadcast notifications (optional)

---

## Related Files

- **Schema**: [prisma/schema.prisma](prisma/schema.prisma)
- **Firebase Service**: [src/modules/notification/firebase.service.ts](src/modules/notification/firebase.service.ts)
- **Notification Service**: [src/modules/notification/push-notification.service.ts](src/modules/notification/push-notification.service.ts)
- **Controllers**: 
  - [src/modules/notification/notification.controller.ts](src/modules/notification/notification.controller.ts)
  - [src/modules/users/users.controller.ts](src/modules/users/users.controller.ts)
- **DTOs**: [src/modules/notification/dto/](src/modules/notification/dto/)
- **Mobile Guide**: [FCM_MOBILE_INTEGRATION_GUIDE.md](FCM_MOBILE_INTEGRATION_GUIDE.md)
