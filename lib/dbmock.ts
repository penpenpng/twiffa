const database: Credentials[] = [];

export const getCredentials = (sessionId: string): Credentials | undefined => {
  return database.find((e) => e.sessionId === sessionId);
};

export const createEmptyCredentials = (sessionId: string): Credentials => {
  const credentials = {
    sessionId,
  };

  database.push(credentials);

  return credentials;
};

export const updateCredentials = (
  sessionId: string,
  credentials: Partial<Credentials>
) => {
  Object.assign(
    database.find((e) => e.sessionId === sessionId),
    credentials
  );

  console.log("update:", sessionId, credentials);
  console.log("current database:", database);
};

export const getCredentialsByRequestToken = (
  requestToken: string
): Credentials | undefined => {
  console.log("getCredentialsByRequestToken:", requestToken);
  console.log("database:", database);

  return requestToken && database.find((e) => e.requestToken === requestToken);
};
