import type { Recording } from "@/hooks/useRecording";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

const TRANSCRIPTION_MODEL = "whisper-large-v3";
const TRANSCRIPTION_ENDPOINT =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const REQUEST_TIMEOUT_MS = 60_000;

export type TranscriptionErrorKind =
  | "no_key"
  | "invalid_key"
  | "rate_limit"
  | "too_large"
  | "network"
  | "timeout"
  | "empty"
  | "unknown"
  | "too_short";

export class TranscriptionError extends Error {
  constructor(
    readonly kind: TranscriptionErrorKind,
    readonly httpStatus?: number,
  ) {
    super(kind);
    this.name = "TranscriptionError";
  }
}

export async function transcribeAudio(
  recording: Recording,
  apiKey: string | null,
): Promise<string> {
  const normalizedApiKey = apiKey?.trim();
  if (!normalizedApiKey) {
    throw new TranscriptionError("no_key");
  }
  if (recording.durationSec < 2) {
    throw new TranscriptionError("too_short");
  }

  const audioFile = new File(recording.uri);
  const formData = new FormData();
  formData.append("file", audioFile);
  formData.append("model", TRANSCRIPTION_MODEL);
  formData.append("language", "pl");
  formData.append("temperature", "0");
  formData.append("response_format", "json");

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(TRANSCRIPTION_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });
    } catch {
      throw new TranscriptionError(timedOut ? "timeout" : "network");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new TranscriptionError("invalid_key");
      }
      if (response.status === 429) {
        throw new TranscriptionError("rate_limit");
      }
      if (response.status === 413) {
        throw new TranscriptionError("too_large");
      }
      throw new TranscriptionError("unknown", response.status);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new TranscriptionError("unknown");
    }

    const text =
      typeof payload === "object" &&
      payload !== null &&
      "text" in payload &&
      typeof payload.text === "string"
        ? payload.text.trim()
        : "";

    if (!text) {
      throw new TranscriptionError("empty");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}
