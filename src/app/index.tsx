import { Link, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useApiKey } from "@/hooks/useApiKey";
import { useRecording } from "@/hooks/useRecording";
import { useTranscription } from "@/hooks/useTranscription";

export default function Index() {
  const { apiKey, loading: apiKeyLoading, error: apiKeyError, refresh } =
    useApiKey();
  const hasFocused = useRef(false);
  const {
    state,
    time,
    recording,
    start,
    stop,
    error,
    isProcessing,
    openSettings,
  } = useRecording();
  const transcription = useTranscription();
  const isRecording = state === "recording";
  const showSettingsButton =
    error?.code === "permission-denied" || error?.code === "settings-failed";

  const startNewRecording = () => {
    transcription.reset();
    void start();
  };

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        void refresh();
      }
      hasFocused.current = true;
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>VOICEAPP</Text>
        <Text style={styles.title}>Nagranie wywiadu</Text>
        <Text style={styles.description}>
          Nagraj odpowiedzi przed teleporadą. Nagranie może trwać maksymalnie 3
          minuty.
        </Text>

        {!apiKeyLoading && !apiKey && !apiKeyError && (
          <View style={styles.apiKeyNotice}>
            <Text style={styles.apiKeyNoticeText}>
              Nie zapisano klucza API Groq. Nagrywanie działa bez klucza; będzie
              potrzebny dopiero przy transkrypcji.
            </Text>
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="link" style={styles.apiKeyLink}>
                <Text style={styles.apiKeyLinkText}>
                  Otwórz ustawienia klucza
                </Text>
              </Pressable>
            </Link>
          </View>
        )}

        {apiKeyError && (
          <View style={styles.apiKeyNotice} accessibilityLiveRegion="assertive">
            <Text style={styles.apiKeyErrorText}>{apiKeyError}</Text>
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="link" style={styles.apiKeyLink}>
                <Text style={styles.apiKeyLinkText}>
                  Otwórz ustawienia klucza
                </Text>
              </Pressable>
            </Link>
          </View>
        )}

        {!apiKeyLoading && apiKey && (
          <Link href="/settings" asChild>
            <Pressable accessibilityRole="link" style={styles.apiKeyLink}>
              <Text style={styles.apiKeyLinkText}>Ustawienia klucza API</Text>
            </Pressable>
          </Link>
        )}

        <View style={styles.recorder}>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.timer, isRecording && styles.timerRecording]}
          >
            {formatTime(time)}
          </Text>
          <Text style={styles.status}>
            {isRecording
              ? "Nagrywanie w toku"
              : state === "stopped"
                ? "Nagranie zakończone"
                : "Gotowy do nagrania"}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isRecording ? "Zatrzymaj nagranie" : "Rozpocznij nagranie"}
            disabled={isProcessing}
            onPress={isRecording ? stop : startNewRecording}
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

        {error && (
          <View style={styles.messageBox} accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>{error.message}</Text>
            {showSettingsButton && (
              <Pressable
                accessibilityRole="button"
                onPress={openSettings}
                style={styles.settingsButton}
              >
                <Text style={styles.settingsButtonText}>
                  Otwórz ustawienia
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {recording && (
          <View style={styles.result} accessibilityLiveRegion="polite">
            <Text style={styles.resultTitle}>Dane nagrania (testowo)</Text>
            <Text selectable style={styles.resultText}>
              URI: {recording.uri}
            </Text>
            <Text style={styles.resultText}>
              Długość: {formatDuration(recording.durationSec)}
            </Text>
            <Text style={styles.resultText}>Typ: {recording.mimeType}</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          disabled={!recording || transcription.status === "loading"}
          onPress={() => {
            if (recording) {
              void transcription.run(recording, apiKey);
            }
          }}
          style={({ pressed }) => [
            styles.transcriptionButton,
            (!recording || transcription.status === "loading") &&
              styles.disabledButton,
            pressed && recording && styles.pressedButton,
          ]}
        >
          <Text style={styles.buttonText}>Transkrybuj</Text>
        </Pressable>

        {transcription.status === "loading" && (
          <View style={styles.transcriptionLoading} accessibilityLiveRegion="polite">
            <ActivityIndicator color="#176B5B" />
            <Text style={styles.transcriptionLoadingText}>
              Transkrypcja w toku...
            </Text>
          </View>
        )}

        {transcription.error && (
          <View style={styles.messageBox} accessibilityLiveRegion="assertive">
            <Text style={styles.errorText}>
              {transcription.error.message}
            </Text>
            {(transcription.error.kind === "no_key" ||
              transcription.error.kind === "invalid_key") && (
              <Link href="/settings" asChild>
                <Pressable accessibilityRole="link" style={styles.settingsButton}>
                  <Text style={styles.settingsButtonText}>
                    Otwórz ustawienia klucza
                  </Text>
                </Pressable>
              </Link>
            )}
          </View>
        )}

        {transcription.status === "done" && (
          <View style={styles.transcriptionResult}>
            <Text style={styles.resultTitle}>Transkrypcja</Text>
            <TextInput
              accessibilityLabel="Transkrypcja nagrania"
              editable={false}
              multiline
              scrollEnabled
              style={styles.transcriptionText}
              textAlignVertical="top"
              value={transcription.text}
            />
          </View>
        )}

        {(transcription.status === "done" ||
          transcription.status === "error") && (
          <Pressable
            accessibilityRole="button"
            onPress={transcription.reset}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>Wyczyść transkrypcję</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(seconds: number) {
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function formatDuration(seconds: number) {
  return `${seconds.toFixed(1)} s`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  eyebrow: {
    color: "#52647A",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 12,
    color: "#142B45",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    maxWidth: 360,
    marginTop: 12,
    color: "#52647A",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  apiKeyNotice: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
  },
  apiKeyNoticeText: {
    color: "#70521A",
    fontSize: 14,
    lineHeight: 21,
  },
  apiKeyErrorText: {
    color: "#8E2530",
    fontSize: 14,
    lineHeight: 21,
  },
  apiKeyLink: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
  },
  apiKeyLinkText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
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
  messageBox: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
  },
  errorText: {
    color: "#8E2530",
    fontSize: 15,
    lineHeight: 22,
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
  transcriptionLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  transcriptionLoadingText: {
    color: "#52647A",
    fontSize: 14,
  },
  transcriptionResult: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E8F2EF",
  },
  transcriptionText: {
    minHeight: 140,
    maxHeight: 280,
    padding: 0,
    color: "#244C44",
    fontSize: 15,
    lineHeight: 22,
  },
  resetButton: {
    marginTop: 12,
    padding: 8,
  },
  resetButtonText: {
    color: "#176B5B",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  result: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E8F2EF",
  },
  resultTitle: {
    marginBottom: 8,
    color: "#17483D",
    fontSize: 15,
    fontWeight: "700",
  },
  resultText: {
    marginTop: 4,
    color: "#244C44",
    fontSize: 14,
    lineHeight: 20,
  },
});
