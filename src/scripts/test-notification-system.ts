import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotificationSystem() {
  console.log('=== Testing Notification System ===\n');

  try {
    // 1. Check PushNotification table
    console.log('1. Checking PushNotification table...');
    const notificationCount = await prisma.pushNotification.count();
    console.log(`   Total notifications in database: ${notificationCount}`);

    if (notificationCount > 0) {
      const recentNotifications = await prisma.pushNotification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, name: true } } },
      });

      console.log('\n   Recent notifications:');
      recentNotifications.forEach((notif) => {
        console.log(
          `   - ${notif.title} | ${notif.type} | ${notif.status} | User: ${notif.user.email}`,
        );
      });
    }

    // 2. Check users eligible for notifications
    console.log('\n2. Checking users eligible for notifications...');
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        role: 'USER',
      },
      include: {
        notifications: true,
      },
    });

    console.log(`   Total ACTIVE USER role users: ${users.length}`);

    const usersWithFcm = users.filter((u) => u.fcmTokens);
    console.log(`   Users with FCM tokens: ${usersWithFcm.length}`);

    const usersWithNotifPrefs = users.filter((u) => u.notifications.length > 0);
    console.log(
      `   Users with notification preferences: ${usersWithNotifPrefs.length}`,
    );

    const usersWithNewOfferEnabled = users.filter(
      (u) =>
        u.fcmTokens &&
        u.notifications.length > 0 &&
        u.notifications[0].newOffer === true,
    );
    console.log(
      `   Users eligible for new offer notifications: ${usersWithNewOfferEnabled.length}`,
    );

    if (usersWithNewOfferEnabled.length > 0) {
      console.log('\n   Eligible users:');
      usersWithNewOfferEnabled.forEach((u) => {
        const tokens = (u.fcmTokens as any) || [];
        const tokenCount = Array.isArray(tokens) ? tokens.length : 0;
        console.log(`   - ${u.email} (${tokenCount} FCM token(s))`);
      });
    } else {
      console.log(
        '\n   ⚠️  NO USERS ARE ELIGIBLE for new offer notifications!',
      );
      console.log('   This is why notifications are not being created.');
    }

    // 3. Check recent offers
    console.log('\n3. Checking recent offers...');
    const offers = await prisma.offer.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        VendorProfile: { select: { businessName: true } },
      },
    });

    console.log(`   Total offers: ${await prisma.offer.count()}`);
    if (offers.length > 0) {
      console.log('\n   Recent offers:');
      offers.forEach((o) => {
        console.log(
          `   - ${o.title} | ${o.type} | ${o.VendorProfile?.businessName || 'Unknown'} | ${o.createdAt.toISOString()}`,
        );
      });
    }

    // 4. Recommendations
    console.log('\n=== Recommendations ===');
    if (usersWithNewOfferEnabled.length === 0) {
      console.log('\n⚠️  To fix the notification issue, you need to:');
      console.log('   1. Create ACTIVE users with USER role');
      console.log(
        '   2. Register FCM tokens for those users (via /api/notifications/register-token)',
      );
      console.log(
        '   3. Ensure users have UserNotification records with newOffer = true',
      );

      if (users.length > 0) {
        console.log('\n   You have users but they might be missing:');
        if (usersWithFcm.length === 0) {
          console.log('   - FCM tokens (register via the mobile app)');
        }
        if (usersWithNotifPrefs.length === 0) {
          console.log(
            '   - Notification preferences (UserNotification records)',
          );
        }
      }
    } else {
      console.log('✅ System is configured correctly!');
      console.log(
        '   Notifications should be created when new offers are added.',
      );
    }

    // 5. Check if notifications were created for recent offers
    if (offers.length > 0 && notificationCount > 0) {
      console.log(
        '\n4. Checking if notifications were created for recent offers...',
      );
      for (const offer of offers) {
        const notifCount = await prisma.pushNotification.count({
          where: {
            type: 'NEW_OFFER',
            data: {
              path: ['offerId'],
              equals: offer.id,
            },
          },
        });
        console.log(
          `   Offer "${offer.title}": ${notifCount} notification(s) created`,
        );
      }
    }
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationSystem();
