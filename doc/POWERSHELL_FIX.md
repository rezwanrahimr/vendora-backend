# Quick Fix for PowerShell Execution Policy

## The Error You're Seeing

```
npx.ps1 cannot be loaded because running scripts is disabled on this system
```

## Solution 1: Enable Scripts (Recommended)

Open PowerShell **as Administrator** and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then restart your terminal and try again.

## Solution 2: Bypass for Single Command

```powershell
powershell -ExecutionPolicy Bypass -Command "npm run test-notifications"
```

## Solution 3: Use CMD Instead

Open Command Prompt (CMD) instead of PowerShell:

```cmd
cd E:\yasminaarsic-server
npm run test-notifications
```

## Solution 4: Check Database Manually

Instead of running the script, manually check the database:

### Using Prisma Studio
```cmd
cd E:\yasminaarsic-server
node node_modules\prisma\build\index.js studio
```

Then navigate to `PushNotification` table in the browser.

### Using psql or pgAdmin

Connect to your database and run:

```sql
-- Check total notifications
SELECT COUNT(*) as total FROM "PushNotification";

-- Check recent notifications  
SELECT * FROM "PushNotification" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Check eligible users
SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    CASE 
        WHEN u."fcmTokens" IS NULL THEN 'No tokens'
        ELSE 'Has tokens'
    END as token_status,
    un."newOffer"
FROM "User" u
LEFT JOIN "UserNotification" un ON u.id = un."userId"
WHERE u.role = 'USER' AND u.status = 'ACTIVE';
```

## After Fixing

Once you can run scripts, test the notification system:

```bash
npm run test-notifications
```

This will show you exactly why notifications aren't being stored.
