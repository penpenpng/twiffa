import firebase from "./firebase";

import { error } from "./error";

const firestore = firebase.firestore();
const table = firestore.collection("sessions");

export const getSessionRecord = async (
  sessionId: string
): Promise<SessionRecord | undefined> => {
  try {
    const doc = await table.doc(sessionId).get();

    if (!doc.exists) {
      return undefined;
    }

    return doc.data() as SessionRecord;
  } catch {
    throw error("DATABASE_ERROR");
  }
};

export const touchSessionRecord = async (sessionId: string): Promise<void> => {
  try {
    await table.doc(sessionId).set({ sessionId }, { merge: true });
  } catch {
    throw error("DATABASE_ERROR");
  }
};

export const updateSessionRecord = async (
  sessionId: string,
  record: Partial<SessionRecord>
): Promise<void> => {
  try {
    await table.doc(sessionId).set(record, { merge: true });
  } catch {
    throw error("DATABASE_ERROR");
  }
};

export const deleteSessionRecord = async (sessionId: string): Promise<void> => {
  try {
    await table.doc(sessionId).delete();
  } catch {
    throw error("DATABASE_ERROR");
  }
};

export const getSessionRecordByRequestToken = async (
  requestToken: string
): Promise<SessionRecord | undefined> => {
  try {
    const querySnapshot = await table
      .where("requestToken", "==", requestToken)
      .get();

    if (querySnapshot.size > 1) {
      console.error("Table is dirty! Code may have a bug.");
    }

    const doc = querySnapshot.docs[0];

    if (!doc.exists) {
      return undefined;
    }

    return doc.data() as SessionRecord;
  } catch {
    throw error("DATABASE_ERROR");
  }
};
