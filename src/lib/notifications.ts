import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "@/lib/firebase-client";

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const messaging = await getMessagingInstance();
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        });
        return token;
      }
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
};

export const sendNotification = (
  title: string,
  options?: NotificationOptions
) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, options);
  }
};

export const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
};
