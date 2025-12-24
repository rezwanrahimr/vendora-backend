import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n'); // Handle escaped newlines
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );

      // Debug: Log loaded credentials (remove in production)
      console.log('=== Firebase Configuration Debug ===');
      console.log('Project ID:', projectId);
      console.log('Client Email:', clientEmail);
      console.log('Private Key exists:', !!privateKey);
      console.log('Private Key length:', privateKey?.length);
      console.log('Private Key starts with:', privateKey?.substring(0, 50));
      console.log('====================================');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase credentials not configured. Push notifications will not work.',
        );
        return;
      }

      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
      });

      this.logger.log(
        `Firebase Admin SDK initialized successfully for project: ${projectId}`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK', error);
    }
  }

  getMessaging(): admin.messaging.Messaging | null {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase app not initialized');
      return null;
    }
    return admin.messaging(this.firebaseApp);
  }

  async sendToDevice(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{ success: boolean; error?: string }> {
    const messaging = this.getMessaging();
    if (!messaging) {
      return { success: false, error: 'Firebase not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      await messaging.send(message);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send notification to token: ${token}`, error);
      
      // Check if token is invalid
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        return { success: false, error: 'INVALID_TOKEN' };
      }

      return { success: false, error: error.message };
    }
  }

  async sendToMultipleDevices(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ): Promise<{
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
  }> {
    const messaging = this.getMessaging();
    if (!messaging) {
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered')
        ) {
          invalidTokens.push(tokens[idx]);
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
      };
    } catch (error) {
      this.logger.error('Failed to send multicast notification', error);
      
      // Check if it's a Firebase configuration error
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        this.logger.error(
          'Firebase project not found. Please verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env file.',
        );
      }
      
      return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
    }
  }
}
