export type Summary = {
  glowna_dolegliwosc: string | null;
  czas_trwania: string | null;
  nasilenie: string | null;
  leki: string[] | null;
  alergie: string[] | null;
  inne_informacje: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwnField(
  record: Record<string, unknown>,
  field: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(record, field);
}

function normalizeText(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return undefined;
  }

  return value.trim() || null;
}

function normalizeStringArray(
  value: unknown,
): string[] | null | undefined {
  if (value === null) {
    return null;
  }
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalizedItems: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return undefined;
    }

    const normalizedItem = item.trim();
    if (normalizedItem) {
      normalizedItems.push(normalizedItem);
    }
  }

  return normalizedItems;
}

export function parseSummary(value: unknown): Summary | null {
  if (!isRecord(value)) {
    return null;
  }

  const requiredFields = [
    "glowna_dolegliwosc",
    "czas_trwania",
    "nasilenie",
    "leki",
    "alergie",
    "inne_informacje",
  ];
  if (!requiredFields.every((field) => hasOwnField(value, field))) {
    return null;
  }

  const glownaDolegliwosc = normalizeText(value.glowna_dolegliwosc);
  const czasTrwania = normalizeText(value.czas_trwania);
  const nasilenie = normalizeText(value.nasilenie);
  const leki = normalizeStringArray(value.leki);
  const alergie = normalizeStringArray(value.alergie);
  const inneInformacje = normalizeStringArray(value.inne_informacje);

  if (
    glownaDolegliwosc === undefined ||
    czasTrwania === undefined ||
    nasilenie === undefined ||
    leki === undefined ||
    alergie === undefined ||
    inneInformacje === undefined ||
    inneInformacje === null
  ) {
    return null;
  }

  return {
    glowna_dolegliwosc: glownaDolegliwosc,
    czas_trwania: czasTrwania,
    nasilenie,
    leki,
    alergie,
    inne_informacje: inneInformacje,
  };
}

export function getMissingFields(summary: Summary): string[] {
  const missingFields: string[] = [];
  if (summary.glowna_dolegliwosc === null) {
    missingFields.push("główna dolegliwość");
  }
  if (summary.czas_trwania === null) {
    missingFields.push("czas trwania");
  }
  if (summary.nasilenie === null) {
    missingFields.push("nasilenie");
  }
  if (summary.leki === null) {
    missingFields.push("leki");
  }
  if (summary.alergie === null) {
    missingFields.push("alergie");
  }

  return missingFields;
}
