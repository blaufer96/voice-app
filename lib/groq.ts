import type { Recording } from "@/hooks/useRecording";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt";
import { parseSummary, type Summary } from "./summary";
import { File } from "expo-file-system";
import { fetch } from "expo/fetch";

export const EXTRACTION_MODEL = "openai/gpt-oss-120b";

const TRANSCRIPTION_MODEL = "whisper-large-v3";
const TRANSCRIPTION_ENDPOINT =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const CHAT_COMPLETIONS_ENDPOINT =
  "https://api.groq.com/openai/v1/chat/completions";
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

export type SummaryExtractionErrorKind = TranscriptionErrorKind | "parse_error";

export class SummaryExtractionError extends Error {
  constructor(
    readonly kind: SummaryExtractionErrorKind,
    readonly httpStatus?: number,
  ) {
    super(kind);
    this.name = "SummaryExtractionError";
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

export async function extractSummary(
  transcript: string,
  apiKey: string,
): Promise<Summary> {
  const normalizedApiKey = apiKey.trim();
  if (!normalizedApiKey) {
    throw new SummaryExtractionError("no_key");
  }
  if (!transcript.trim()) {
    throw new SummaryExtractionError("empty");
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let response: Response;
    try {
      response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EXTRACTION_MODEL,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: `<transkrypcja>\n${transcript}\n</transkrypcja>`,
            },
          ],
          temperature: 0,
          max_completion_tokens: 2048,
          reasoning_effort: "low",
          reasoning_format: "hidden",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "medical_summary",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  glowna_dolegliwosc: { type: ["string", "null"] },
                  czas_trwania: { type: ["string", "null"] },
                  nasilenie: { type: ["string", "null"] },
                  leki: {
                    type: ["array", "null"],
                    items: { type: "string" },
                  },
                  alergie: {
                    type: ["array", "null"],
                    items: { type: "string" },
                  },
                  inne_informacje: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: [
                  "glowna_dolegliwosc",
                  "czas_trwania",
                  "nasilenie",
                  "leki",
                  "alergie",
                  "inne_informacje",
                ],
                additionalProperties: false,
              },
            },
          },
        }),
        signal: controller.signal,
      });
    } catch {
      throw new SummaryExtractionError(timedOut ? "timeout" : "network");
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new SummaryExtractionError("invalid_key");
      }
      if (response.status === 429) {
        throw new SummaryExtractionError("rate_limit");
      }
      if (response.status === 413) {
        throw new SummaryExtractionError("too_large");
      }
      throw new SummaryExtractionError("unknown", response.status);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new SummaryExtractionError(timedOut ? "timeout" : "unknown");
    }

    const content =
      typeof payload === "object" &&
      payload !== null &&
      "choices" in payload &&
      Array.isArray(payload.choices) &&
      typeof payload.choices[0] === "object" &&
      payload.choices[0] !== null &&
      "message" in payload.choices[0] &&
      typeof payload.choices[0].message === "object" &&
      payload.choices[0].message !== null &&
      "content" in payload.choices[0].message &&
      typeof payload.choices[0].message.content === "string"
        ? payload.choices[0].message.content
        : "";

    if (!content.trim()) {
      throw new SummaryExtractionError("empty");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new SummaryExtractionError("parse_error");
    }

    const summary = parseSummary(parsed);
    if (!summary) {
      throw new SummaryExtractionError("parse_error");
    }

    return summary;
  } finally {
    clearTimeout(timeout);
  }
}
