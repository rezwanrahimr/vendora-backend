@echo off
REM Quick Database Check Script for Windows CMD

echo === Checking Push Notification System ===
echo.

echo Opening Prisma Studio to check database...
echo Navigate to PushNotification table to see stored notifications
echo.

cd /d E:\yasminaarsic-server
node node_modules\prisma\build\index.js studio

echo.
echo Prisma Studio opened in your browser
echo Check these tables:
echo   1. PushNotification - Should contain notification records
echo   2. User - Check if users have fcmTokens
echo   3. UserNotification - Check if newOffer is enabled
echo.
pause
