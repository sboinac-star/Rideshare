import { db } from "./firebase";
import {
  collection, doc, setDoc, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, where, getDoc, updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import type { Message, Chat } from "./types";

export function buildChatId(
  listingType: "journey" | "request",
  listingId: string,
  initiatorUid: string,
) {
  return `${listingType}_${listingId}_${initiatorUid}`;
}

export async function getOrCreateChat(
  id: string,
  participants: [string, string],
  listingType: "journey" | "request",
  listingId: string,
  route: string,
  participantNames: Record<string, string>,
): Promise<void> {
  const ref = doc(db, "chats", id);
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
  await addDoc(collection(db, "chats", chatId, "messages"), {
    uid,
    senderName,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: text.slice(0, 100),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, "chats", chatId, "messages"),
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
): Unsubscribe {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid),
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
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
  });
}
