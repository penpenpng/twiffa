import firebase from "./firebase";

const firestore = firebase.firestore();
const table = firestore.collection("sessions");

export const getSessionRecord = async (
  sessionId: string
): Promise<SessionRecord | undefined> => {
  const doc = await table.doc(sessionId).get();

  if (!doc.exists) {
    return undefined;
  }

  return doc.data() as SessionRecord;
};

export const touchSessionRecord = async (sessionId: string): Promise<void> => {
  await table.doc(sessionId).set({ sessionId }, { merge: true });
};

export const updateSessionRecord = async (
  sessionId: string,
  record: Partial<SessionRecord>
): Promise<void> => {
  const olddoc = await table.doc(sessionId).get();

  console.log(
    `merge '${JSON.stringify(record)}' into '${JSON.stringify(olddoc.data())}'`
  );

  await table.doc(sessionId).set(record, { merge: true });

  const newdoc = await table.doc(sessionId).get();

  console.log(`result in '${JSON.stringify(newdoc.data())}'`);
};

export const getSessionRecordByRequestToken = async (
  requestToken: string
): Promise<SessionRecord | undefined> => {
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
};
