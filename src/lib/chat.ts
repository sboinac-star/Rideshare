import { db, col } from "./firebase";
import {
  collection, doc, setDoc, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, where, getDoc, updateDoc, getDocs, limit,
  type Unsubscribe,
} from "firebase/firestore";
import type { Message, Chat } from "./types";

export function buildChatId(
  listingType: "journey" | "request",
  listingId: string,
  uid1: string,
  uid2: string,
) {
  return `${listingType}_${listingId}_${[uid1, uid2].sort().join("_")}`;
}

export async function getOrCreateChat(
  id: string,
  participants: [string, string],
  listingType: "journey" | "request",
  listingId: string,
  route: string,
  participantNames: Record<string, string>,
): Promise<void> {
  const ref = doc(db, col("chats"), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      participants,
      listingType,
      listingId,
      route,
      participantNames,
      lastMessage: "",
      updatedAt: serverTimestamp(),
    });
  }
}

export async function sendMessage(
  chatId: string,
  uid: string,
  senderName: string,
  text: string,
): Promise<void> {
  await addDoc(collection(db, col("chats"), chatId, "messages"), {
    uid,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, col("chats"), chatId), {
    lastMessage: text.slice(0, 100),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, col("chats"), chatId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        uid: d.data().uid as string,
        senderName: d.data().senderName as string,
        text: d.data().text as string,
        createdAt: d.data().createdAt?.toDate() ?? null,
      })),
    );
  });
}

export function subscribeToUserChats(
  uid: string,
  callback: (chats: Chat[]) => void,
  onError?: () => void,
): Unsubscribe {
  const q = query(
    collection(db, col("chats")),
    where("participants", "array-contains", uid),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          participants: d.data().participants as string[],
          listingType: d.data().listingType as "journey" | "request",
          listingId: d.data().listingId as string,
          route: d.data().route as string,
          participantNames: d.data().participantNames as Record<string, string>,
          lastMessage: d.data().lastMessage as string,
          updatedAt: d.data().updatedAt?.toDate() ?? null,
        })),
      );
    },
    () => { onError?.(); },
  );
}

export async function lookupUserName(uid: string): Promise<string> {
  const jSnap = await getDocs(
    query(collection(db, "journeys"), where("uid", "==", uid), limit(1))
  );
  if (!jSnap.empty) {
    const name = jSnap.docs[0].data().driverName as string | undefined;
    if (name) return name;
  }
  const rSnap = await getDocs(
    query(collection(db, "requests"), where("uid", "==", uid), limit(1))
  );
  if (!rSnap.empty) {
    const name = rSnap.docs[0].data().passengerName as string | undefined;
    if (name) return name;
  }
  return "";
}
