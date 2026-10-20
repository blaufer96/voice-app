import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const MAX_DURATION_SEC = 180;

export type Recording = {
  uri: string;
  mimeType: string;
  durationSec: number;
};

export type RecordingError = {
  code: "permission-denied" | "recording-failed" | "settings-failed";
  message: string;
};

type RecordingStatus = "idle" | "recording" | "stopped";

export function useRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecordingStatus>("idle");
  const [time, setTime] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState<RecordingError | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingActiveRef = useRef(false);
  const stoppingRef = useRef(false);
  const startingRef = useRef(false);

  const stop = async () => {
    if (!recordingActiveRef.current || stoppingRef.current) {
      return;
    }

    stoppingRef.current = true;
    recordingActiveRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const durationSec = Math.max(
        0,
        recorder.currentTime,
        recorder.getStatus().durationMillis / 1000,
      );
      await recorder.stop();
      const uri = recorder.uri ?? recorder.getStatus().url;

      if (!uri) {
        throw new Error("Rejestrator nie zwrócił pliku nagrania.");
      }

      setRecording({
        uri,
        mimeType: Platform.OS === "web" ? "audio/webm" : "audio/mp4",
        durationSec,
      });
      setTime(durationSec);
      setState("stopped");
    } catch (stopError) {
      const detail =
        stopError instanceof Error ? ` ${stopError.message}` : "";
      setError({
        code: "recording-failed",
        message: `Nie udało się zapisać nagrania.${detail}`,
      });
      setState("stopped");
    } finally {
      stoppingRef.current = false;
    }
  };

  const start = async () => {
    if (startingRef.current || recordingActiveRef.current) {
      return;
    }

    startingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setRecording(null);
    setTime(0);

    try {
      let permission = await AudioModule.getRecordingPermissionsAsync();
      if (!permission.granted) {
        permission = await AudioModule.requestRecordingPermissionsAsync();
      }

      if (!permission.granted) {
        setError({
          code: "permission-denied",
          message:
            "Brak zgody na dostęp do mikrofonu. Włącz ją w ustawieniach, aby nagrać wywiad.",
        });
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordingActiveRef.current = true;
      setState("recording");

      timerRef.current = setInterval(() => {
        const currentTime = Math.min(recorder.currentTime, MAX_DURATION_SEC);
        setTime(currentTime);
        if (currentTime >= MAX_DURATION_SEC) {
          void stop();
        }
      }, 250);
    } catch (startError) {
      const detail =
        startError instanceof Error ? ` ${startError.message}` : "";
      setError({
        code: "recording-failed",
        message: `Nie udało się rozpocząć nagrania.${detail}`,
      });
    } finally {
      startingRef.current = false;
      setIsProcessing(false);
    }
  };

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (settingsError) {
      const detail =
        settingsError instanceof Error ? ` ${settingsError.message}` : "";
      setError({
        code: "settings-failed",
        message: `Nie udało się otworzyć ustawień. Otwórz ustawienia aplikacji ręcznie.${detail}`,
      });
    }
  };

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    },
    [],
  );

  return {
    state,
    time,
    recording,
    start,
    stop,
    error,
    isProcessing,
    openSettings,
  };
}
