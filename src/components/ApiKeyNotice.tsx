import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ErrorBox } from "./ErrorBox";

type ApiKeyNoticeProps = {
  showMissingKeyNotice: boolean;
  hasApiKey: boolean;
  error: string | null;
};

export function ApiKeyNotice({
  showMissingKeyNotice,
  hasApiKey,
  error,
}: ApiKeyNoticeProps) {
  return (
    <>
      {showMissingKeyNotice && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Nie zapisano klucza API Groq. Nagrywanie działa bez klucza; będzie
            potrzebny dopiero przy transkrypcji.
          </Text>
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="link" style={styles.link}>
              <Text style={styles.linkText}>Otwórz ustawienia klucza</Text>
            </Pressable>
          </Link>
        </View>
      )}
      {error && (
        <ErrorBox
          message={error}
          settingsLink
          variant="apiKey"
          settingsLabel="Otwórz ustawienia klucza"
        />
      )}
      {hasApiKey && (
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkText}>Ustawienia klucza API</Text>
          </Pressable>
        </Link>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  notice: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
  },
  noticeText: {
    color: "#70521A",
    fontSize: 14,
    lineHeight: 21,
  },
  link: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
  },
  linkText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
