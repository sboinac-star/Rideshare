importScripts(
  "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.5.0/firebase-messaging.compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSy...", // Replace with your Firebase config
  authDomain: "nwa-rideshare.firebaseapp.com",
  projectId: "nwa-rideshare",
  storageBucket: "nwa-rideshare.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image,
    tag: payload.data?.rideId || "ride-notification",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rideId = event.notification.data?.rideId;
  if (rideId) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (
            client.url === "/" &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(`/rides`);
        }
      })
    );
  }
});
