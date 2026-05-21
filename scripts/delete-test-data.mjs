// Run once to delete all test user data from Firestore.
// Usage: node scripts/delete-test-data.mjs
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { execSync } from "child_process";

const TEST_UIDS = ["test-user-1", "test-user-2"];
const PROJECT_ID = "nwa-rideshare-all-usa";

// Use Application Default Credentials (firebase login already set these up)
if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}
const db = getFirestore();

async function deleteWhere(collectionName) {
  let total = 0;
  for (const uid of TEST_UIDS) {
    const snap = await db.collection(collectionName).where("uid", "==", uid).get();
    for (const docSnap of snap.docs) {
      await docSnap.ref.delete();
      console.log(`Deleted ${collectionName}/${docSnap.id} (uid: ${uid})`);
      total++;
    }
  }
  return total;
}

async function deleteTestChats() {
  // Chats where both participants are test users (test-to-test chats)
  const snap = await db.collection("chats").get();
  let total = 0;
  for (const docSnap of snap.docs) {
    const participants = docSnap.data().participants ?? [];
    if (participants.some((p) => TEST_UIDS.includes(p))) {
      // Delete subcollection messages first
      const msgs = await docSnap.ref.collection("messages").get();
      for (const msg of msgs.docs) await msg.ref.delete();
      await docSnap.ref.delete();
      console.log(`Deleted chat/${docSnap.id}`);
      total++;
    }
  }
  return total;
}

(async () => {
  console.log("Deleting test user data from Firestore...\n");
  const j = await deleteWhere("journeys");
  const r = await deleteWhere("requests");
  const c = await deleteTestChats();
  console.log(`\nDone. Deleted: ${j} journeys, ${r} requests, ${c} chats.`);
})();
