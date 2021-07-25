import firebase from "./firebase";

const firestore = firebase.firestore();
const table = firestore.collection("credentials");

export const getCredentials = async (
  sessionId: string
): Promise<Credentials | undefined> => {
  const doc = await table.doc(sessionId).get();

  if (!doc.exists) {
    return undefined;
  }

  return doc.data() as Credentials;
};

export const createEmptyCredentials = async (
  sessionId: string
): Promise<void> => {
  await table.doc(sessionId).set({
    sessionId,
  });
};

export const updateCredentials = async (
  sessionId: string,
  credentials: Partial<Credentials>
): Promise<void> => {
  await table.doc(sessionId).set(credentials, { merge: true });
};

export const getCredentialsByRequestToken = async (
  requestToken: string
): Promise<Credentials | undefined> => {
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

  return doc.data() as Credentials;
};
