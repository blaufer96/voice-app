import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ErrorBoxProps = {
  message: string;
  settingsLink?: boolean;
  onOpenSettings?: () => void;
  settingsLabel?: string;
  variant?: "default" | "apiKey";
};

export function ErrorBox({
  message,
  settingsLink = false,
  onOpenSettings,
  settingsLabel = "Otwórz ustawienia klucza",
  variant = "default",
}: ErrorBoxProps) {
  return (
    <View
      style={[
        styles.messageBox,
        variant === "apiKey" && styles.apiKeyMessageBox,
      ]}
      accessibilityLiveRegion="assertive"
    >
      <Text
        style={[
          styles.errorText,
          variant === "apiKey" && styles.apiKeyErrorText,
        ]}
      >
        {message}
      </Text>
      {settingsLink && (
        <Link href="/settings" asChild>
          <Pressable
            accessibilityRole="link"
            style={[
              styles.settingsButton,
              variant === "apiKey" && styles.apiKeySettingsButton,
            ]}
          >
            <Text
              style={[
                styles.settingsButtonText,
                variant === "apiKey" && styles.apiKeySettingsButtonText,
              ]}
            >
              {settingsLabel}
            </Text>
          </Pressable>
        </Link>
      )}
      {onOpenSettings && (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenSettings}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsButtonText}>Otwórz ustawienia</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
  },
  apiKeyMessageBox: {
    backgroundColor: "#FFF8E8",
  },
  errorText: {
    color: "#8E2530",
    fontSize: 15,
    lineHeight: 22,
  },
  apiKeyErrorText: {
    fontSize: 14,
    lineHeight: 21,
  },
  settingsButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: "#8E2530",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  apiKeySettingsButton: {
    marginTop: 8,
    paddingVertical: 6,
  },
  apiKeySettingsButtonText: {
    color: "#176B5B",
    fontSize: 14,
  },
});
