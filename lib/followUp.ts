import type { Summary } from "./summary";

export const FOLLOW_UP_PRIORITY = [
  "glowna_dolegliwosc",
  "alergie",
  "leki",
  "czas_trwania",
  "nasilenie",
] as const;

export type FollowUpField = (typeof FOLLOW_UP_PRIORITY)[number];

export const FOLLOW_UP_QUESTIONS: Record<FollowUpField, string> = {
  glowna_dolegliwosc:
    "Z jakim problemem zgłasza się Pan/Pani do lekarza?",
  alergie: "Czy ma Pan/Pani jakieś alergie?",
  leki: "Czy przyjmuje Pan/Pani jakieś leki lub suplementy?",
  czas_trwania: "Od jak dawna występuje ten problem?",
  nasilenie: "Jak bardzo dokuczliwy jest ten problem?",
};

export type FollowUp = {
  field: FollowUpField;
  question: string;
};

export function getFollowUp(summary: Summary): FollowUp | null {
  const field = FOLLOW_UP_PRIORITY.find(
    (candidate) => summary[candidate] === null,
  );

  return field ? { field, question: FOLLOW_UP_QUESTIONS[field] } : null;
}

export function mergeTranscripts(
  original: string,
  question: string,
  answer: string,
): string {
  return `${original}\n\nPytanie: ${question}\nOdpowiedź: ${answer}`;
}
