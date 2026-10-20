import { useCallback, useRef, useState } from "react";
import {
  extractSummary,
  SummaryExtractionError,
  type SummaryExtractionErrorKind,
} from "../../lib/groq";
import type { Summary } from "../../lib/summary";

export type SummaryStatus = "idle" | "loading" | "done" | "error";

export type SummaryErrorInfo = {
  kind: SummaryExtractionErrorKind;
  message: string;
};

const ERROR_MESSAGES: Record<SummaryExtractionErrorKind, string> = {
  no_key: "Brak klucza API Groq. Dodaj go w ustawieniach.",
  invalid_key: "Klucz API Groq jest nieprawidłowy. Sprawdź go w ustawieniach.",
  rate_limit: "Przekroczono limit zapytań Groq. Spróbuj ponownie później.",
  too_large: "Żądanie przekracza limit rozmiaru dla używanego planu Groq.",
  network: "Nie można połączyć się z Groq. Sprawdź połączenie internetowe.",
  timeout: "Podsumowanie trwało zbyt długo i zostało przerwane. Spróbuj ponownie.",
  empty: "Groq nie zwrócił treści podsumowania. Spróbuj ponownie.",
  unknown: "Nie udało się przygotować podsumowania. Spróbuj ponownie.",
  too_short: "Brak tekstu do podsumowania.",
  parse_error:
    "Odpowiedź Groq ma nieprawidłowy format. Spróbuj ponownie.",
};

function getErrorMessage(kind: SummaryExtractionErrorKind, httpStatus?: number) {
  if (kind !== "unknown" || httpStatus === undefined) {
    return ERROR_MESSAGES[kind];
  }

  if (httpStatus === 400) {
    return "Groq odrzucił żądanie podsumowania (HTTP 400).";
  }
  if (httpStatus === 404) {
    return "Groq nie znalazł wskazanego modelu lub endpointu (HTTP 404).";
  }

  return `Groq zwrócił błąd HTTP ${httpStatus}.`;
}

export function useSummary() {
  const [status, setStatus] = useState<SummaryStatus>("idle");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<SummaryErrorInfo | null>(null);
  const requestId = useRef(0);

  const reset = useCallback(() => {
    requestId.current += 1;
    setStatus("idle");
    setSummary(null);
    setError(null);
  }, []);

  const run = useCallback(async (transcript: string, apiKey: string) => {
    const currentRequestId = ++requestId.current;
    setStatus("loading");
    setSummary(null);
    setError(null);

    try {
      const result = await extractSummary(transcript, apiKey);
      if (requestId.current === currentRequestId) {
        setSummary(result);
        setStatus("done");
      }
    } catch (cause) {
      if (requestId.current === currentRequestId) {
        const kind =
          cause instanceof SummaryExtractionError ? cause.kind : "unknown";
        setError({
          kind,
          message: getErrorMessage(
            kind,
            cause instanceof SummaryExtractionError
              ? cause.httpStatus
              : undefined,
          ),
        });
        setStatus("error");
      }
    }
  }, []);

  return { status, summary, error, run, reset };
}
