// src/services/NotificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    static instance = null;
    notificationListener = null;
    responseListener = null;

    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    // Request permissions and get push token
    async registerForPushNotifications() {
        let token = null;

        // Check if running on physical device (required for push notifications)
        if (!Device.isDevice) {
            console.log('[Notifications] Must use physical device for Push Notifications');
            return null;
        }

        // Check existing permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permissions if not granted
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[Notifications] Failed to get push token - permission not granted!');
            return null;
        }

        try {
            // Get the Expo push token
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

            if (!projectId) {
                console.log('[Notifications] No projectId found - using default Expo push token');
                token = (await Notifications.getExpoPushTokenAsync()).data;
            } else {
                token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            }

            console.log('[Notifications] Push Token:', token);
        } catch (error) {
            console.error('[Notifications] Error getting push token:', error);
        }

        // Configure Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF007F',
            });
        }

        return token;
    }

    // Register token with backend
    async registerTokenWithBackend(pushToken, userId) {
        if (!pushToken || !userId) {
            console.log('[Notifications] Cannot register - missing token or userId');
            return false;
        }

        try {
            const result = await api.registerPushToken(pushToken, userId);
            console.log('[Notifications] Token registered with backend:', result);
            return result.success || false;
        } catch (error) {
            console.error('[Notifications] Error registering token with backend:', error);
            return false;
        }
    }

    // Setup notification listeners
    setupListeners(onNotificationReceived, onNotificationResponse) {
        // Listener for notifications received while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('[Notifications] Received in foreground:', notification);
            if (onNotificationReceived) {
                onNotificationReceived(notification);
            }
        });

        // Listener for when user interacts with notification (tap)
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[Notifications] User tapped notification:', response);
            if (onNotificationResponse) {
                onNotificationResponse(response);
            }
        });
    }

    // Remove listeners (cleanup)
    removeListeners() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
    }

    // Get last notification response (for deep linking when app opens from notification)
    async getLastNotificationResponse() {
        return await Notifications.getLastNotificationResponseAsync();
    }

    // Schedule a local notification (for testing)
    async scheduleLocalNotification(title, body, data = {}) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: { seconds: 1 },
        });
    }
}

export default NotificationService;
