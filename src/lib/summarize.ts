import type { ExogenaRecord } from "../types";

export const sumRecords = (records: ExogenaRecord[]) =>
  records.reduce((sum, record) => sum + record.value, 0);

export const uniqueReporterCount = (records: ExogenaRecord[]) =>
  new Set(records.map((record) => record.reporterNit || record.reporterName).filter(Boolean)).size;
