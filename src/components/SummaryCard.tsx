import { getMissingFields, type Summary } from "../../lib/summary";
import { StyleSheet, Text, View } from "react-native";

type SummaryCardProps = {
  summary: Summary;
};

export function SummaryCard({ summary }: SummaryCardProps) {
  const isEmpty =
    summary.glowna_dolegliwosc === null &&
    summary.czas_trwania === null &&
    summary.nasilenie === null &&
    summary.leki === null &&
    summary.alergie === null &&
    summary.inne_informacje.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyNotice} accessibilityLiveRegion="polite">
        <Text style={styles.emptyText}>
          Nie wykryto informacji o dolegliwościach. Spróbuj nagrać ponownie.
        </Text>
      </View>
    );
  }

  const missingFields = getMissingFields(summary);

  return (
    <View style={styles.card} accessibilityLiveRegion="polite">
      <Text style={styles.title}>Sprawdź, czy to się zgadza</Text>
      <SummaryTextField
        label="Główna dolegliwość"
        value={summary.glowna_dolegliwosc}
      />
      <SummaryTextField label="Czas trwania" value={summary.czas_trwania} />
      <SummaryTextField label="Nasilenie" value={summary.nasilenie} />
      <SummaryListField
        label="Leki"
        emptyLabel="Pacjent: brak leków"
        value={summary.leki}
      />
      <SummaryListField
        label="Alergie"
        emptyLabel="Pacjent: brak alergii"
        value={summary.alergie}
      />
      <SummaryListField
        label="Inne informacje"
        emptyLabel="Nie podano"
        value={summary.inne_informacje}
      />
      {missingFields.length > 0 && (
        <View style={styles.missingSection}>
          <Text style={styles.missingTitle}>Czego brakuje</Text>
          {missingFields.map((field) => (
            <Text key={field} style={styles.missingItem}>
              • {field}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function SummaryTextField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? "Nie podano"}</Text>
    </View>
  );
}

function SummaryListField({
  label,
  emptyLabel,
  value,
}: {
  label: string;
  emptyLabel: string;
  value: string[] | null;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {value === null ? (
        <Text style={styles.value}>Nie podano</Text>
      ) : value.length === 0 ? (
        <Text style={styles.value}>{emptyLabel}</Text>
      ) : (
        value.map((item, index) => (
          <Text key={`${item}-${index}`} style={styles.listItem}>
            • {item}
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#142B45",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    marginBottom: 8,
    color: "#142B45",
    fontSize: 19,
    fontWeight: "700",
  },
  field: {
    marginTop: 12,
  },
  label: {
    color: "#52647A",
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    marginTop: 3,
    color: "#244C44",
    fontSize: 15,
    lineHeight: 22,
  },
  listItem: {
    marginTop: 4,
    color: "#244C44",
    fontSize: 15,
    lineHeight: 22,
  },
  missingSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#D6E0E8",
  },
  missingTitle: {
    color: "#70521A",
    fontSize: 14,
    fontWeight: "700",
  },
  missingItem: {
    marginTop: 4,
    color: "#70521A",
    fontSize: 14,
  },
  emptyNotice: {
    width: "100%",
    maxWidth: 380,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
  },
  emptyText: {
    color: "#70521A",
    fontSize: 15,
    lineHeight: 22,
  },
});
