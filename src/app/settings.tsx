import { useApiKey } from "@/hooks/useApiKey";
import { Link } from "expo-router";
import { useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Settings() {
  const { apiKey, loading, error, save, remove } = useApiKey();
  const keyInput = useRef("");
  const inputRef = useRef<TextInput>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveKey = async () => {
    if (isSaving) {
      return;
    }

    const key = keyInput.current.trim();
    if (!key) {
      setNotice("Wpisz klucz API Groq przed zapisaniem.");
      return;
    }

    const warning = key.startsWith("gsk_")
      ? null
      : "Klucz nie zaczyna się od „gsk_”. Możesz go zapisać, ale sprawdź, czy jest poprawny.";
    setNotice(warning);
    setIsSaving(true);

    try {
      const saved = await save(key);
      if (saved) {
        keyInput.current = "";
        inputRef.current?.clear();
        setNotice(warning ?? "Klucz API został zapisany.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const removeKey = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      if (await remove()) {
        setNotice("Klucz API został usunięty.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Klucz API Groq</Text>
        <Text style={styles.description}>
          Klucz jest przechowywany bezpiecznie na tym urządzeniu.
        </Text>

        {loading ? (
          <Text style={styles.status}>Wczytywanie ustawień...</Text>
        ) : apiKey ? (
          <View style={styles.savedKey}>
            <Text style={styles.savedKeyLabel}>Zapisany klucz</Text>
            <Text style={styles.savedKeyValue} accessibilityLabel="Klucz zamaskowany">
              {"••••••••"}
              {apiKey.slice(-4)}
            </Text>
          </View>
        ) : (
          <Text style={styles.status}>Nie zapisano jeszcze klucza API.</Text>
        )}

        <Text style={styles.label}>Nowy klucz</Text>
        <TextInput
          ref={inputRef}
          accessibilityLabel="Klucz API Groq"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(text) => {
            keyInput.current = text;
          }}
          onSubmitEditing={() => void saveKey()}
          placeholder="Wpisz klucz API"
          returnKeyType="done"
          secureTextEntry
          style={styles.input}
          textContentType="none"
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSaving || loading}
          onPress={() => void saveKey()}
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            (pressed || isSaving || loading) && styles.buttonMuted,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving || loading || !apiKey}
          onPress={() => void removeKey()}
          style={({ pressed }) => [
            styles.button,
            styles.secondaryButton,
            (pressed || isSaving || loading || !apiKey) && styles.buttonMuted,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Usuń klucz</Text>
        </Pressable>

        {notice && (
          <Text style={styles.notice} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        )}
        {error && (
          <Text style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </Text>
        )}

        <Link href="/" asChild>
          <Pressable accessibilityRole="link" style={styles.backLink}>
            <Text style={styles.backLinkText}>Powrót do nagrywania</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    color: "#142B45",
    fontSize: 26,
    fontWeight: "700",
  },
  description: {
    marginTop: 10,
    color: "#52647A",
    fontSize: 16,
    lineHeight: 24,
  },
  status: {
    marginTop: 24,
    color: "#52647A",
    fontSize: 15,
  },
  savedKey: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E8F2EF",
  },
  savedKeyLabel: {
    color: "#17483D",
    fontSize: 14,
    fontWeight: "600",
  },
  savedKeyValue: {
    marginTop: 6,
    color: "#17483D",
    fontSize: 16,
    letterSpacing: 1,
  },
  label: {
    marginTop: 28,
    marginBottom: 8,
    color: "#142B45",
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#C8D2DC",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#142B45",
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 20,
    borderRadius: 26,
  },
  primaryButton: {
    backgroundColor: "#176B5B",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#B63845",
    backgroundColor: "#FFFFFF",
  },
  buttonMuted: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#9D2935",
    fontSize: 16,
    fontWeight: "700",
  },
  notice: {
    marginTop: 18,
    color: "#52647A",
    fontSize: 14,
    lineHeight: 21,
  },
  error: {
    marginTop: 18,
    color: "#8E2530",
    fontSize: 14,
    lineHeight: 21,
  },
  backLink: {
    alignSelf: "center",
    marginTop: 28,
    paddingVertical: 10,
  },
  backLinkText: {
    color: "#176B5B",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
