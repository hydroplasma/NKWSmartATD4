import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "teacher_session";

export async function getSessionToken() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const session = JSON.parse(raw);
      return session.token || null;
    }
  } catch (error) {
    return null;
  }
  return null;
}

export async function setSessionToken(token: string) {
  // This might be needed if we use standalone auth functions
}
