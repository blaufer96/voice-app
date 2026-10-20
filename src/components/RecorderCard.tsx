import { Pressable, StyleSheet, Text, View } from "react-native";

type RecorderCardProps = {
  time: number;
  status: string;
  isRecording: boolean;
  isProcessing: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function RecorderCard({
  time,
  status,
  isRecording,
  isProcessing,
  disabled,
  onPress,
}: RecorderCardProps) {
  return (
    <View style={styles.recorder}>
      <Text
        accessibilityLiveRegion="polite"
        style={[styles.timer, isRecording && styles.timerRecording]}
      >
        {formatTime(time)}
      </Text>
      <Text style={styles.status}>{status}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isRecording ? "Zatrzymaj nagranie" : "Rozpocznij nagranie"
        }
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.recordButton,
          isRecording && styles.stopButton,
          pressed && !isProcessing && styles.pressedButton,
          isProcessing && styles.disabledButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {isProcessing
            ? "Chwila..."
            : isRecording
              ? "Zatrzymaj"
              : "Rozpocznij nagrywanie"}
        </Text>
      </Pressable>
    </View>
  );
}

function formatTime(seconds: number) {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  recorder: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    marginTop: 44,
    padding: 28,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142B45",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  timer: {
    color: "#142B45",
    fontSize: 56,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  timerRecording: {
    color: "#C43E4B",
  },
  status: {
    marginTop: 4,
    color: "#68798B",
    fontSize: 15,
  },
  recordButton: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    paddingHorizontal: 28,
    borderRadius: 28,
    backgroundColor: "#176B5B",
  },
  stopButton: {
    backgroundColor: "#B63845",
  },
  pressedButton: {
    opacity: 0.82,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
