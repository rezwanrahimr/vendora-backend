-- Check if notification was created in database
SELECT 
    id,
    "userId",
    title,
    body,
    type,
    status,
    "createdAt",
    "sentAt"
FROM "PushNotification"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check the user's FCM tokens
SELECT 
    id,
    email,
    role,
    status,
    "fcmTokens"
FROM "User"
WHERE id = 'e5c5d967-c282-428b-9d75-08ffe38fa8d8';
