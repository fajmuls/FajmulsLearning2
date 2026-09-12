// Web Notification API Service for Daily Study Reminders & Streak Protection

const NOTIFICATION_KEY = 'fajmuls_notification_settings';

export interface NotificationSettings {
    enabled: boolean;
    reminderTime: string; // "HH:MM" e.g. "19:00"
    lastNotifiedDate?: string; // YYYY-MM-DD
}

export const NotificationService = {
    isSupported(): boolean {
        return typeof window !== 'undefined' && 'Notification' in window;
    },

    getPermission(): NotificationPermission {
        if (!this.isSupported()) return 'denied';
        return Notification.permission;
    },

    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) return false;
        try {
            const perm = await Notification.requestPermission();
            return perm === 'granted';
        } catch (e) {
            console.error('Failed to request notification permission', e);
            return false;
        }
    },

    getSettings(): NotificationSettings {
        try {
            const raw = localStorage.getItem(NOTIFICATION_KEY);
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn('Failed to parse notification settings', e);
        }
        return {
            enabled: false,
            reminderTime: '19:00'
        };
    },

    saveSettings(settings: NotificationSettings) {
        try {
            localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save notification settings', e);
        }
    },

    sendNotification(title: string, options?: NotificationOptions) {
        if (!this.isSupported() || Notification.permission !== 'granted') return;
        try {
            const notif = new Notification(title, {
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                ...options
            });
            notif.onclick = () => {
                window.focus();
                notif.close();
            };
        } catch (e) {
            console.warn('Failed to dispatch notification', e);
        }
    },

    sendTestNotification() {
        if (Notification.permission !== 'granted') return false;
        this.sendNotification("🎯 Fajmuls Learning: Siap Belajar!", {
            body: "Pengingat belajar harian Anda telah aktif. Waktunya latihan soal dan jaga streak belajarmu hari ini!",
            tag: 'test_notification'
        });
        return true;
    },

    // Check if reminder needs to be triggered today
    checkAndTriggerDailyReminder(streakDays: number = 1) {
        if (!this.isSupported() || Notification.permission !== 'granted') return;
        const settings = this.getSettings();
        if (!settings.enabled) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (settings.lastNotifiedDate === todayStr) return;

        const [remHour, remMinute] = settings.reminderTime.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        // If current time is past the scheduled time on the same day
        if (currentHour > remHour || (currentHour === remHour && currentMinute >= remMinute)) {
            this.sendNotification("🔥 Waktunya Belajar Hari Ini!", {
                body: `Pertahankan streak ${streakDays} hari belajarmu. Luangkan 10 menit untuk mengerjakan latihan soal sekarang!`,
                tag: 'daily_study_reminder'
            });
            settings.lastNotifiedDate = todayStr;
            this.saveSettings(settings);
        }
    }
};
