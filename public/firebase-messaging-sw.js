importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-app.compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAJupxOWYRUgoq5gzTwwZEdlitkhCvbgkE",
  authDomain: "nwa-rideshare-all-usa.firebaseapp.com",
  projectId: "nwa-rideshare-all-usa",
  storageBucket: "nwa-rideshare-all-usa.firebasestorage.app",
  messagingSenderId: "523006727771",
  appId: "1:523006727771:web:d43c8cae860440c430d17e",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "NWA Ride Share";
  const body = payload.notification?.body ?? "";
  const chatId = payload.data?.chatId;

  self.registration.showNotification(title, {
    body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: chatId ?? "nwa-msg",
    data: { chatId },
    requireInteraction: false,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow("/messages");
    })
  );
});
