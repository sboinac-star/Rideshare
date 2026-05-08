const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { userId, name, email, phone } = body;

      const driversCollection = collection(db, "drivers");
      const docRef = await addDoc(driversCollection, {
        userId,
        name,
        email,
        phone,
        status: "active",
        rating: 5.0,
        completedRides: 0,
        createdAt: Timestamp.now(),
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, driverId: docRef.id })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to register driver" })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const userId = event.queryStringParameters?.userId;

      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "userId required" })
        };
      }

      const driversCollection = collection(db, "drivers");
      const q = query(driversCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const driver = querySnapshot.docs[0]
        ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
        : null;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ driver })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to fetch driver" })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};