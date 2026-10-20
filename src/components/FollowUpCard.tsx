import { Pressable, StyleSheet, Text, View } from "react-native";

type FollowUpCardProps = {
  question: string;
  buttonLabel: string;
  disabled: boolean;
  showSkip: boolean;
  onAnswer: () => void;
  onSkip: () => void;
};

export function FollowUpCard({
  question,
  buttonLabel,
  disabled,
  showSkip,
  onAnswer,
  onSkip,
}: FollowUpCardProps) {
  return (
    <View style={styles.followUpCard}>
      <Text style={styles.followUpQuestion}>{question}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onAnswer}
        style={({ pressed }) => [
          styles.transcriptionButton,
          styles.summaryButton,
          pressed && !disabled && styles.pressedButton,
        ]}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
      {showSkip && (
        <Pressable
          accessibilityRole="button"
          onPress={onSkip}
          style={styles.skipButton}
        >
          <Text style={styles.resetButtonText}>Pomiń</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  followUpCard: {
    width: "100%",
    maxWidth: 380,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E8F2EF",
  },
  followUpQuestion: {
    color: "#17483D",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  transcriptionButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 380,
    marginTop: 18,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: "#176B5B",
  },
  summaryButton: {
    marginTop: 12,
    backgroundColor: "#244C44",
  },
  pressedButton: {
    opacity: 0.82,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    alignSelf: "center",
    marginTop: 8,
    padding: 8,
  },
  resetButtonText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
