import type { ExogenaRecord } from "../types";

export const sumRecords = (records: ExogenaRecord[]) =>
  records.reduce((sum, record) => sum + record.value, 0);

export const uniqueReporterCount = (records: ExogenaRecord[]) =>
  new Set(records.map((record) => record.reporterNit || record.reporterName).filter(Boolean)).size;

export const groupByReporter = (records: ExogenaRecord[]) => {
  const totals = new Map<string, { name: string; nit: string; value: number; count: number }>();

  records.forEach((record) => {
    const key = record.reporterNit || record.reporterName || record.id;
    const current = totals.get(key) ?? {
      name: record.reporterName || "Sin nombre",
      nit: record.reporterNit,
      value: 0,
      count: 0,
    };

    current.value += record.value;
    current.count += 1;
    totals.set(key, current);
  });

  return [...totals.values()].sort((left, right) => right.value - left.value);
};

export const groupByTope = (records: ExogenaRecord[]) => {
  const totals = new Map<string, { label: string; value: number; count: number }>();

  records.forEach((record) => {
    const labels = record.topes.length ? record.topes : ["Sin tope"];
    labels.forEach((label) => {
      const current = totals.get(label) ?? { label, value: 0, count: 0 };
      current.value += record.value;
      current.count += 1;
      totals.set(label, current);
    });
  });

  return [...totals.values()].sort((left, right) => right.value - left.value);
};
