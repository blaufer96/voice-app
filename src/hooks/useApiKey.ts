import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

const API_KEY_STORAGE_KEY = "groq-api-key";

async function getStoredApiKey() {
  if (Platform.OS === "web") {
    throw new Error("SecureStore is unavailable on web.");
  }

  return SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
}

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setApiKey(await getStoredApiKey());
    } catch {
      setError("Nie udało się odczytać klucza API. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (key: string) => {
    setError(null);

    try {
      if (Platform.OS === "web") {
        throw new Error("SecureStore is unavailable on web.");
      }

      await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, key);
      setApiKey(key);
      return true;
    } catch {
      setError("Nie udało się bezpiecznie zapisać klucza API.");
      return false;
    }
  }, []);

  const remove = useCallback(async () => {
    setError(null);

    try {
      if (Platform.OS === "web") {
        throw new Error("SecureStore is unavailable on web.");
      }

      await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
      setApiKey(null);
      return true;
    } catch {
      setError("Nie udało się bezpiecznie usunąć klucza API.");
      return false;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    getStoredApiKey()
      .then((storedKey) => {
        if (isActive) {
          setApiKey(storedKey);
        }
      })
      .catch(() => {
        if (isActive) {
          setError("Nie udało się odczytać klucza API. Spróbuj ponownie.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return { apiKey, loading, error, save, remove, refresh };
}
