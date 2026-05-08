/**
 * Message Service Layer
 * Handles all messaging-related database operations
 */

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { Message, COLLECTIONS } from "../db";

/**
 * Send a message between driver and passenger
 */
export async function sendMessage(
  db: Firestore,
  messageData: Omit<Message, "id" | "createdAt" | "read">
): Promise<{ id: string; message: Message }> {
  try {
    const messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    const docRef = await addDoc(messagesCollection, {
      ...messageData,
      read: false,
      createdAt: Timestamp.now(),
    });

    return {
      id: docRef.id,
      message: {
        id: docRef.id,
        ...messageData,
        read: false,
        createdAt: Timestamp.now(),
      } as Message,
    };
  } catch (error) {
    throw new Error(`Failed to send message: ${error}`);
  }
}

/**
 * Get all messages for a specific journey
 */
export async function getMessagesByJourney(
  db: Firestore,
  journeyId: string,
  pageSize = 50
): Promise<Message[]> {
  try {
    const messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesCollection,
      where("journeyId", "==", journeyId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
    const querySnapshot = await getDocs(q);

    // Reverse to get oldest first
    return querySnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .reverse() as Message[];
  } catch (error) {
    throw new Error(`Failed to get messages by journey: ${error}`);
  }
}

/**
 * Get messages between two users for a specific journey
 */
export async function getConversation(
  db: Firestore,
  journeyId: string,
  userId1: string,
  userId2: string,
  pageSize = 50
): Promise<Message[]> {
  try {
    const messagesCollection = collection(db, COLLECTIONS.MESSAGES);

    // Query messages where one is sender and other is recipient
    const q1 = query(
      messagesCollection,
      where("journeyId", "==", journeyId),
      where("senderId", "==", userId1),
      where("recipientId", "==", userId2),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const q2 = query(
      messagesCollection,
      where("journeyId", "==", journeyId),
      where("senderId", "==", userId2),
      where("recipientId", "==", userId1),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2),
    ]);

    const messages = [
      ...snapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
      ...snapshot2.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    ] as Message[];

    // Sort by timestamp
    messages.sort((a, b) => {
      const timeA = (a.createdAt as any).toMillis?.() || 0;
      const timeB = (b.createdAt as any).toMillis?.() || 0;
      return timeA - timeB;
    });

    return messages.slice(-pageSize);
  } catch (error) {
    throw new Error(`Failed to get conversation: ${error}`);
  }
}

/**
 * Get unread messages for a user
 */
export async function getUnreadMessages(
  db: Firestore,
  recipientId: string
): Promise<Message[]> {
  try {
    const messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesCollection,
      where("recipientId", "==", recipientId),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error) {
    throw new Error(`Failed to get unread messages: ${error}`);
  }
}

/**
 * Mark message as read
 */
export async function markMessageAsRead(
  db: Firestore,
  messageId: string
): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await updateDoc(messageRef, {
      read: true,
    });
  } catch (error) {
    throw new Error(`Failed to mark message as read: ${error}`);
  }
}

/**
 * Mark all messages in a conversation as read
 */
export async function markConversationAsRead(
  db: Firestore,
  journeyId: string,
  recipientId: string
): Promise<void> {
  try {
    const messagesCollection = collection(db, COLLECTIONS.MESSAGES);
    const q = query(
      messagesCollection,
      where("journeyId", "==", journeyId),
      where("recipientId", "==", recipientId),
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);

    const batch = querySnapshot.docs.map((docSnap) =>
      updateDoc(doc(db, COLLECTIONS.MESSAGES, docSnap.id), { read: true })
    );

    await Promise.all(batch);
  } catch (error) {
    throw new Error(`Failed to mark conversation as read: ${error}`);
  }
}

/**
 * Get count of unread messages for a user
 */
export async function getUnreadMessageCount(
  db: Firestore,
  recipientId: string
): Promise<number> {
  try {
    const unread = await getUnreadMessages(db, recipientId);
    return unread.length;
  } catch (error) {
    throw new Error(`Failed to get unread message count: ${error}`);
  }
}

/**
 * Delete message
 */
export async function deleteMessage(db: Firestore, messageId: string): Promise<void> {
  try {
    const messageRef = doc(db, COLLECTIONS.MESSAGES, messageId);
    await deleteDoc(messageRef);
  } catch (error) {
    throw new Error(`Failed to delete message: ${error}`);
  }
}
