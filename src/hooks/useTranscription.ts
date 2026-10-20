import { useCallback, useRef, useState } from "react";
import {
  transcribeAudio,
  TranscriptionError,
  type TranscriptionErrorKind,
} from "../../lib/groq";
import type { Recording } from "@/hooks/useRecording";

export type TranscriptionStatus = "idle" | "loading" | "done" | "error";

export type TranscriptionErrorInfo = {
  kind: TranscriptionErrorKind;
  message: string;
};

const ERROR_MESSAGES: Record<TranscriptionErrorKind, string> = {
  no_key: "Brak klucza API Groq. Dodaj go w ustawieniach.",
  invalid_key: "Klucz API Groq jest nieprawidłowy. Sprawdź go w ustawieniach.",
  rate_limit: "Przekroczono limit zapytań Groq. Spróbuj ponownie później.",
  too_large: "Plik nagrania przekracza limit rozmiaru dla używanego planu Groq.",
  network: "Nie można połączyć się z Groq. Sprawdź połączenie internetowe.",
  timeout: "Transkrypcja trwała zbyt długo i została przerwana. Spróbuj ponownie.",
  empty: "Groq zwrócił pustą transkrypcję. Spróbuj ponownie z dłuższym nagraniem.",
  unknown: "Nie udało się przetranskrybować nagrania. Spróbuj ponownie.",
  too_short: "Nagranie musi trwać co najmniej 2 sekundy.",
};

function getErrorMessage(kind: TranscriptionErrorKind, httpStatus?: number) {
  if (kind !== "unknown" || httpStatus === undefined) {
    return ERROR_MESSAGES[kind];
  }

  if (httpStatus === 400) {
    return "Groq odrzucił żądanie (HTTP 400). Sprawdź format nagrania.";
  }
  if (httpStatus === 404) {
    return "Groq nie znalazł wskazanego modelu lub endpointu (HTTP 404).";
  }
  if (httpStatus === 422) {
    return "Groq nie może przetworzyć tego pliku audio (HTTP 422).";
  }

  return `Groq zwrócił błąd HTTP ${httpStatus}.`;
}

export function useTranscription() {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [text, setText] = useState("");
  const [error, setError] = useState<TranscriptionErrorInfo | null>(null);
  const requestId = useRef(0);

  const reset = useCallback(() => {
    requestId.current += 1;
    setStatus("idle");
    setText("");
    setError(null);
  }, []);

  const run = useCallback(
    async (recording: Recording, apiKey: string | null) => {
      const currentRequestId = ++requestId.current;
      setStatus("loading");
      setText("");
      setError(null);

      try {
        const result = await transcribeAudio(recording, apiKey);
        if (requestId.current === currentRequestId) {
          setText(result);
          setStatus("done");
        }
      } catch (cause) {
        if (requestId.current === currentRequestId) {
          const kind =
            cause instanceof TranscriptionError ? cause.kind : "unknown";
          setError({
            kind,
            message: getErrorMessage(
              kind,
              cause instanceof TranscriptionError ? cause.httpStatus : undefined,
            ),
          });
          setStatus("error");
        }
      }
    },
    [],
  );

  return { status, text, error, run, reset };
}
