-- Check if PushNotification table exists and has data
SELECT COUNT(*) as total_notifications FROM "PushNotification";

-- Check recent notifications
SELECT * FROM "PushNotification" ORDER BY "createdAt" DESC LIMIT 10;

-- Check users with FCM tokens
SELECT 
    id, 
    email, 
    role, 
    status, 
    "fcmTokens",
    "lastActiveAt"
FROM "User" 
WHERE role = 'USER' AND status = 'ACTIVE';

-- Check user notification preferences
SELECT 
    u.id,
    u.email,
    un."newOffer",
    un."renewalReminder",
    un.promotional
FROM "User" u
LEFT JOIN "UserNotification" un ON u.id = un."userId"
WHERE u.role = 'USER' AND u.status = 'ACTIVE';

-- Check recent offers
SELECT * FROM "Offer" ORDER BY "createdAt" DESC LIMIT 5;
