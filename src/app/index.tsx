import { ApiKeyNotice } from "@/components/ApiKeyNotice";
import { ErrorBox } from "@/components/ErrorBox";
import { FollowUpCard } from "@/components/FollowUpCard";
import { RecorderCard } from "@/components/RecorderCard";
import { SummaryCard } from "@/components/SummaryCard";
import { useApiKey } from "@/hooks/useApiKey";
import { useRecording } from "@/hooks/useRecording";
import { useSummary } from "@/hooks/useSummary";
import { useTranscription } from "@/hooks/useTranscription";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  getFollowUp,
  mergeTranscripts,
  type FollowUp,
} from "../../lib/followUp";

type FollowUpPhase = "idle" | "recording" | "complete";

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
  const summary = useSummary();
  const [fullTranscript, setFullTranscript] = useState("");
  const [followUpUsed, setFollowUpUsed] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<FollowUp | null>(
    null,
  );
  const [followUpPhase, setFollowUpPhase] =
    useState<FollowUpPhase>("idle");
  const followUpAnswerProcessed = useRef(false);
  const followUpRequestId = useRef(0);
  const isRecording = state === "recording";
  const {
    run: runTranscription,
    status: transcriptionStatus,
  } = transcription;
  const { run: runSummary, status: summaryStatus } = summary;
  const followUp = summary.summary ? getFollowUp(summary.summary) : null;
  const visibleFollowUp =
    summary.status === "done" &&
    !followUpUsed &&
    followUpPhase !== "complete"
      ? followUpQuestion ?? followUp
      : null;
  const showSettingsButton =
    error?.code === "permission-denied" || error?.code === "settings-failed";
  const showMissingKeyNotice =
    !apiKeyLoading && !apiKey && !apiKeyError;
  const canTranscribe =
    Boolean(recording) &&
    transcription.status !== "loading" &&
    followUpQuestion === null &&
    followUpPhase === "idle" &&
    !followUpUsed;
  const canSummarize =
    Boolean(transcription.text) &&
    summary.status !== "loading" &&
    followUpPhase === "idle";
  const canAnswerFollowUp =
    followUpPhase !== "recording" ||
    isRecording ||
    transcriptionStatus === "error" ||
    !error;
  const showSkipFollowUp =
    followUpPhase === "idle" ||
    (!isRecording &&
      (transcriptionStatus === "error" || Boolean(error)));
  const followUpButtonLabel =
    followUpPhase === "recording"
      ? isRecording
        ? "Zatrzymaj odpowiedź"
        : transcriptionStatus === "loading"
          ? "Transkrypcja odpowiedzi..."
          : summaryStatus === "loading"
            ? "Aktualizowanie podsumowania..."
            : "Odpowiedz głosem"
      : "Odpowiedz głosem";

  const resetFollowUp = () => {
    setFullTranscript("");
    setFollowUpUsed(false);
    setFollowUpQuestion(null);
    setFollowUpPhase("idle");
    followUpAnswerProcessed.current = false;
    followUpRequestId.current += 1;
  };

  const startNewRecording = () => {
    transcription.reset();
    summary.reset();
    resetFollowUp();
    void start();
  };

  const resetResults = () => {
    transcription.reset();
    summary.reset();
    resetFollowUp();
  };

  const startTranscription = () => {
    summary.reset();
    resetFollowUp();
    if (recording) {
      void transcription.run(recording, apiKey);
    }
  };

  const startSummary = () => {
    setFullTranscript(transcription.text);
    void summary.run(transcription.text, apiKey ?? "");
  };

  const startFollowUp = (question: FollowUp) => {
    setFollowUpQuestion(question);
    followUpRequestId.current += 1;
    followUpAnswerProcessed.current = false;
    transcription.reset();
    setFollowUpPhase("recording");
    void start();
  };

  const handleFollowUpAction = () => {
    if (followUpPhase === "recording") {
      if (isRecording) {
        void stop();
      } else if (visibleFollowUp && (transcription.error || error)) {
        startFollowUp(visibleFollowUp);
      }
    } else if (followUpPhase === "idle" && visibleFollowUp) {
      startFollowUp(visibleFollowUp);
    }
  };

  const skipFollowUp = () => {
    followUpRequestId.current += 1;
    setFollowUpUsed(true);
    setFollowUpQuestion(null);
    setFollowUpPhase("idle");
  };

  useFocusEffect(
    useCallback(() => {
      if (hasFocused.current) {
        void refresh();
      }
      hasFocused.current = true;
    }, [refresh]),
  );

  useEffect(() => {
    if (
      followUpPhase === "recording" &&
      state === "stopped" &&
      recording &&
      transcriptionStatus === "idle" &&
      !followUpAnswerProcessed.current
    ) {
      const currentRequestId = followUpRequestId.current;
      void (async () => {
        const answer = await runTranscription(recording, apiKey);
        if (
          !answer ||
          currentRequestId !== followUpRequestId.current ||
          followUpAnswerProcessed.current ||
          !followUpQuestion
        ) {
          return;
        }

        followUpAnswerProcessed.current = true;
        const combinedTranscript = mergeTranscripts(
          fullTranscript,
          followUpQuestion.question,
          answer,
        );
        setFollowUpQuestion(null);
        setFullTranscript(combinedTranscript);
        setFollowUpUsed(true);
        await runSummary(combinedTranscript, apiKey ?? "");
        if (currentRequestId === followUpRequestId.current) {
          setFollowUpPhase("complete");
        }
      })();
    }
  }, [
    apiKey,
    followUpPhase,
    followUpQuestion,
    fullTranscript,
    recording,
    runTranscription,
    state,
    runSummary,
    transcriptionStatus,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>VOICEAPP</Text>
        <Text style={styles.title}>Wywiad medyczny</Text>
        <Text style={styles.description}>
          Nagraj odpowiedzi przed teleporadą. Nagranie może trwać maksymalnie 3
          minuty.
        </Text>

        <ApiKeyNotice
          showMissingKeyNotice={showMissingKeyNotice}
          hasApiKey={!apiKeyLoading && Boolean(apiKey)}
          error={apiKeyError}
        />

        <RecorderCard
          time={time}
          status={
            isRecording
              ? followUpPhase === "recording"
                ? "Nagrywanie odpowiedzi"
                : "Nagrywanie w toku"
              : state === "stopped"
                ? "Nagranie zakończone"
                : "Gotowy do nagrania"
          }
          isRecording={isRecording}
          isProcessing={isProcessing}
          disabled={
            isProcessing ||
            (followUpPhase === "recording" && !isRecording)
          }
          onPress={isRecording ? stop : startNewRecording}
        />

        {error && (
          <ErrorBox
            message={error.message}
            onOpenSettings={showSettingsButton ? openSettings : undefined}
          />
        )}

        <Pressable
          accessibilityRole="button"
          disabled={!canTranscribe}
          onPress={startTranscription}
          style={({ pressed }) => [
            styles.transcriptionButton,
            !canTranscribe && styles.disabledButton,
            pressed && canTranscribe && styles.pressedButton,
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

        {transcription.status === "done" && Boolean(transcription.text) && (
          <Pressable
            accessibilityRole="button"
            disabled={!canSummarize}
            onPress={startSummary}
            style={({ pressed }) => [
              styles.transcriptionButton,
              styles.summaryButton,
              !canSummarize && styles.disabledButton,
              pressed && canSummarize && styles.pressedButton,
            ]}
          >
            <Text style={styles.buttonText}>Podsumuj</Text>
          </Pressable>
        )}

        {summary.status === "loading" && (
          <View style={styles.transcriptionLoading} accessibilityLiveRegion="polite">
            <ActivityIndicator color="#176B5B" />
            <Text style={styles.transcriptionLoadingText}>
              Przygotowywanie podsumowania...
            </Text>
          </View>
        )}

        {summary.error && (
          <ErrorBox
            message={summary.error.message}
            settingsLink={
              summary.error.kind === "no_key" ||
              summary.error.kind === "invalid_key"
            }
          />
        )}

        {summary.status === "done" && summary.summary && (
          <SummaryCard summary={summary.summary} />
        )}

        {visibleFollowUp && (
          <FollowUpCard
            question={visibleFollowUp.question}
            buttonLabel={followUpButtonLabel}
            disabled={!canAnswerFollowUp}
            showSkip={showSkipFollowUp}
            onAnswer={handleFollowUpAction}
            onSkip={skipFollowUp}
          />
        )}

        {transcription.error && (
          <ErrorBox
            message={transcription.error.message}
            settingsLink={
              transcription.error.kind === "no_key" ||
              transcription.error.kind === "invalid_key"
            }
          />
        )}

        {(transcription.status === "done" || fullTranscript.length > 0) && (
          <View style={styles.transcriptionResult}>
            <Text style={styles.resultTitle}>Transkrypcja</Text>
            <TextInput
              accessibilityLabel="Transkrypcja nagrania"
              editable={false}
              multiline
              scrollEnabled
              style={styles.transcriptionText}
              textAlignVertical="top"
              value={fullTranscript || transcription.text}
            />
          </View>
        )}

        {(transcription.status === "done" ||
          transcription.status === "error" ||
          summary.status === "done" ||
          summary.status === "error") && (
          <Pressable
            accessibilityRole="button"
            onPress={resetResults}
            style={styles.resetButton}
          >
            <Text style={styles.resetButtonText}>Wyczyść wyniki</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
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
  resultTitle: {
    marginBottom: 8,
    color: "#17483D",
    fontSize: 15,
    fontWeight: "700",
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
});
