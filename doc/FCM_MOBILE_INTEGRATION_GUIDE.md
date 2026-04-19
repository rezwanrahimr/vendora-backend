# Firebase Push Notifications API Documentation for Mobile Developers

## Overview

This document provides complete guidance for integrating Firebase Cloud Messaging (FCM) push notifications in your mobile application. The backend uses Firebase Admin SDK to send real-time push notifications to users for new offers, renewal reminders, and promotional content.

---

## Table of Contents

1. [Setup Requirements](#setup-requirements)
2. [FCM Token Registration Flow](#fcm-token-registration-flow)
3. [API Endpoints](#api-endpoints)
4. [Notification Payload Structure](#notification-payload-structure)
5. [Deep Linking](#deep-linking)
6. [Testing Guide](#testing-guide)
7. [Error Handling](#error-handling)

---

## Setup Requirements

### Firebase Project Setup

1. **Get Firebase Configuration**
   - Obtain your Firebase project credentials from the backend team
   - Ensure your app's package name (Android) or bundle ID (iOS) is registered in the Firebase Console

### Android Setup

```gradle
// Add to app/build.gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}

// Add google-services.json to app/ directory
```

### iOS Setup

```ruby
# Add to Podfile
pod 'Firebase/Messaging'

# Add GoogleService-Info.plist to project
```

---

## FCM Token Registration Flow

### Step 1: Obtain FCM Token

#### Android (Kotlin)

```kotlin
import com.google.firebase.messaging.FirebaseMessaging

FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (task.isSuccessful) {
        val token = task.result
        registerTokenWithBackend(token, "ANDROID")
    }
}
```

#### iOS (Swift)

```swift
import FirebaseMessaging

Messaging.messaging().token { token, error in
    if let token = token {
        registerTokenWithBackend(token: token, platform: "IOS")
    }
}
```

#### React Native (JavaScript)

```javascript
import messaging from '@react-native-firebase/messaging';

async function registerToken() {
  const token = await messaging().getToken();
  const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  await registerTokenWithBackend(token, platform);
}
```

### Step 2: Register Token with Backend

**Endpoint:** `POST /api/v1/users/fcm-token`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "dK7X9fR3QK6yYGq2nY1BvC:APA91bH...",
  "platform": "ANDROID",
  "deviceId": "abc123-device-id"
}
```

**Parameters:**
- `token` (required): FCM token from Firebase SDK
- `platform` (required): One of `"IOS"`, `"ANDROID"`, `"WEB"`
- `deviceId` (optional): Unique device identifier to prevent duplicates

**Response:**
```json
{
  "success": true,
  "message": "FCM token registered successfully",
  "data": {
    "registered": true
  }
}
```

### Step 3: Handle Token Refresh

FCM tokens can expire or change. Listen for token refresh events and update the backend.

#### Android

```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        registerTokenWithBackend(token, "ANDROID")
    }
}
```

#### iOS

```swift
extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        if let token = fcmToken {
            registerTokenWithBackend(token: token, platform: "IOS")
        }
    }
}
```

### Step 4: Remove Token on Logout

**Endpoint:** `DELETE /api/v1/users/fcm-token`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "dK7X9fR3QK6yYGq2nY1BvC:APA91bH..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token removed successfully"
}
```

---

## API Endpoints

### 1. Get User Notifications

Retrieve paginated list of user's notification history.

**Endpoint:** `GET /api/v1/notifications`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Query Parameters:**
- `type` (optional): Filter by notification type (`NEW_OFFER`, `RENEWAL_REMINDER`, `PROMOTIONAL`, `VENDOR_APPROVED`, `SYSTEM`)
- `status` (optional): Filter by status (`PENDING`, `SENT`, `FAILED`, `READ`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**
```
GET /api/v1/notifications?type=NEW_OFFER&status=SENT&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "data": [
      {
        "id": "notif-uuid-123",
        "userId": "user-uuid-456",
        "title": "New Offer Available!",
        "body": "Check out the new BOGO offer from Bella Vista Restaurant",
        "type": "NEW_OFFER",
        "status": "SENT",
        "data": {
          "offerId": "offer-uuid-789",
          "offerType": "BOGO",
          "screen": "OfferDetail"
        },
        "sentAt": "2025-12-24T10:00:00.000Z",
        "readAt": null,
        "createdAt": "2025-12-24T10:00:00.000Z",
        "updatedAt": "2025-12-24T10:00:00.000Z"
      }
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### 2. Get Unread Notification Count

Get the count of unread notifications for badge display.

**Endpoint:** `GET /api/v1/notifications/unread-count`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "count": 3
  }
}
```

**Usage:** Update app badge counter or notification bell icon.

### 3. Mark Notification as Read

Mark a specific notification as read when user taps on it.

**Endpoint:** `PATCH /api/v1/notifications/:id/read`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read successfully"
}
```

### 4. Delete Notification

Remove a notification from user's history.

**Endpoint:** `DELETE /api/v1/notifications/:id`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

### 5. Update Notification Preferences

Control which types of notifications the user wants to receive.

**Endpoint:** `PATCH /api/v1/users/notification-preferences`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "newOffer": true,
  "renewalReminder": true,
  "promotional": false
}
```

**Parameters:**
- `newOffer` (optional): Receive notifications for new offers
- `renewalReminder` (optional): Receive subscription renewal reminders
- `promotional` (optional): Receive promotional notifications

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated successfully"
}
```

---

## Notification Payload Structure

All push notifications follow this structure:

### FCM Message Format

```json
{
  "notification": {
    "title": "New Offer Available!",
    "body": "Check out the new BOGO offer from Bella Vista Restaurant"
  },
  "data": {
    "offerId": "offer-uuid-789",
    "offerType": "BOGO",
    "screen": "OfferDetail"
  }
}
```

### Notification Types and Data Payloads

#### 1. NEW_OFFER

Sent when a new offer is created by a vendor.

```json
{
  "notification": {
    "title": "New Offer Available!",
    "body": "Check out the new BOGO offer from Bella Vista Restaurant"
  },
  "data": {
    "type": "NEW_OFFER",
    "offerId": "offer-uuid-123",
    "offerType": "BOGO",
    "screen": "OfferDetail"
  }
}
```

**Action:** Navigate to Offer Detail screen with `offerId`

#### 2. RENEWAL_REMINDER

Sent before a subscription or offer expires.

```json
{
  "notification": {
    "title": "Subscription Renewal Reminder",
    "body": "Your subscription expires in 3 days"
  },
  "data": {
    "type": "RENEWAL_REMINDER",
    "subscriptionId": "sub-uuid-456",
    "screen": "Subscription"
  }
}
```

**Action:** Navigate to Subscription screen

#### 3. PROMOTIONAL

Marketing and promotional content.

```json
{
  "notification": {
    "title": "Special Weekend Promotion",
    "body": "Double savings this weekend at PowerFit Gym!"
  },
  "data": {
    "type": "PROMOTIONAL",
    "promotionId": "promo-uuid-789",
    "screen": "Promotions"
  }
}
```

**Action:** Navigate to Promotions screen

#### 4. VENDOR_APPROVED

Sent to vendors when their account is approved.

```json
{
  "notification": {
    "title": "Account Approved!",
    "body": "Your vendor account has been approved. Start creating offers now!"
  },
  "data": {
    "type": "VENDOR_APPROVED",
    "screen": "VendorDashboard"
  }
}
```

**Action:** Navigate to Vendor Dashboard

---

## Deep Linking

### Handling Notification Taps

#### Android (Kotlin)

```kotlin
class MyFirebaseMessagingService : FirebaseMessagingService() {
    
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        remoteMessage.data.let { data ->
            val screen = data["screen"]
            val offerId = data["offerId"]
            
            when (screen) {
                "OfferDetail" -> navigateToOfferDetail(offerId)
                "Subscription" -> navigateToSubscription()
                "Promotions" -> navigateToPromotions()
                "VendorDashboard" -> navigateToVendorDashboard()
            }
        }
    }
    
    private fun navigateToOfferDetail(offerId: String?) {
        val intent = Intent(this, OfferDetailActivity::class.java).apply {
            putExtra("OFFER_ID", offerId)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(intent)
    }
}
```

#### iOS (Swift)

```swift
extension AppDelegate: UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let userInfo = response.notification.request.content.userInfo
        
        if let screen = userInfo["screen"] as? String {
            switch screen {
            case "OfferDetail":
                if let offerId = userInfo["offerId"] as? String {
                    navigateToOfferDetail(offerId: offerId)
                }
            case "Subscription":
                navigateToSubscription()
            case "Promotions":
                navigateToPromotions()
            case "VendorDashboard":
                navigateToVendorDashboard()
            default:
                break
            }
        }
        
        completionHandler()
    }
}
```

#### React Native (JavaScript)

```javascript
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

// Handle notification tap when app is in background or quit
messaging().onNotificationOpenedApp(remoteMessage => {
  const { screen, offerId } = remoteMessage.data;
  
  switch (screen) {
    case 'OfferDetail':
      navigation.navigate('OfferDetail', { offerId });
      break;
    case 'Subscription':
      navigation.navigate('Subscription');
      break;
    case 'Promotions':
      navigation.navigate('Promotions');
      break;
    case 'VendorDashboard':
      navigation.navigate('VendorDashboard');
      break;
  }
});

// Handle notification when app was opened from quit state
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      const { screen, offerId } = remoteMessage.data;
      // Handle navigation
    }
  });
```

### Recommended Screen Names

Use these screen names in your navigation for consistency:

- `OfferDetail` - Individual offer details
- `OffersList` - List of all offers
- `Subscription` - User subscription management
- `Promotions` - Promotional offers list
- `VendorDashboard` - Vendor dashboard (for vendors only)
- `Notifications` - Notification history screen
- `Profile` - User profile settings

---

## Testing Guide

### 1. Test Token Registration

```bash
# Register FCM token
curl -X POST https://your-api.com/api/v1/users/fcm-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "platform": "ANDROID",
    "deviceId": "test-device-123"
  }'
```

### 2. Verify Token Storage

Check your user profile to see if the token was stored:

```bash
curl -X GET https://your-api.com/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Test Notification Preferences

Disable new offer notifications:

```bash
curl -X PATCH https://your-api.com/api/v1/users/notification-preferences \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newOffer": false,
    "renewalReminder": true,
    "promotional": true
  }'
```

### 4. Trigger Test Notification

Ask a vendor to create a new offer, or ask the backend team to trigger a test notification.

### 5. Verify Notification Receipt

Check notification history:

```bash
curl -X GET https://your-api.com/api/v1/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Test Deep Linking

- Receive notification while app is in background
- Tap notification
- Verify app opens to correct screen with correct data

---

## Error Handling

### Common Errors and Solutions

#### 1. Token Registration Failed

**Error:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution:** Ensure valid JWT token is included in Authorization header.

#### 2. Invalid Token Format

**Error:**
```json
{
  "statusCode": 400,
  "message": ["token must be a string", "token should not be empty"]
}
```

**Solution:** Verify FCM token is a valid string from Firebase SDK.

#### 3. Firebase Not Configured

If Firebase credentials are missing on the backend, notifications will fail silently. Contact backend team to verify Firebase setup.

#### 4. Token Expired or Invalid

FCM tokens can become invalid. Implement token refresh logic:

```kotlin
// Android: Listen for token refresh
override fun onNewToken(token: String) {
    registerTokenWithBackend(token, "ANDROID")
}
```

#### 5. No Notifications Received

**Checklist:**
- ✅ FCM token registered successfully
- ✅ User has notification permissions enabled
- ✅ Notification preferences are enabled for the notification type
- ✅ App is properly configured with Firebase
- ✅ Device has internet connection
- ✅ Firebase credentials are configured on backend

---

## Best Practices

### 1. Request Permission Appropriately

**iOS:** Request notification permission when user is likely to accept (e.g., after onboarding)

```swift
UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
    if granted {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
}
```

**Android 13+:** Request notification permission at runtime

```kotlin
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), REQUEST_CODE)
}
```

### 2. Update Badge Counter

When receiving notifications, update app badge:

```javascript
// React Native
import PushNotification from 'react-native-push-notification';

const updateBadgeCount = async () => {
  const response = await fetch('/api/v1/notifications/unread-count', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const { data } = await response.json();
  PushNotification.setApplicationIconBadgeNumber(data.count);
};
```

### 3. Handle Foreground Notifications

Display notifications even when app is in foreground:

```kotlin
// Android
override fun onMessageReceived(remoteMessage: RemoteMessage) {
    if (isAppInForeground()) {
        showInAppNotification(remoteMessage)
    }
}
```

### 4. Sync Notification State

When marking notifications as read, update local UI immediately:

```javascript
const markAsRead = async (notificationId) => {
  // Update UI optimistically
  setNotifications(prev => prev.map(n => 
    n.id === notificationId ? { ...n, status: 'READ' } : n
  ));
  
  // Sync with backend
  await fetch(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` }
  });
};
```

### 5. Handle Multiple Devices

Users can have the app installed on multiple devices (phone + tablet). The backend handles sending to all registered devices automatically.

---

## Support

For technical support or questions:

1. Check backend API is running and accessible
2. Verify Firebase configuration with backend team
3. Test with sample FCM tokens using Firebase Console
4. Review device logs for FCM errors

---

## Changelog

- **v1.0.0** (2025-12-24): Initial release
  - FCM token registration
  - Push notification sending
  - Notification history
  - Deep linking support
  - Notification preferences
