import JSZip from "jszip";
import type { ExogenaRecord, ExogenaReport, ReportMetadata, Threshold } from "../types";

type CellValue = string | number | boolean | Date | null | undefined;
type RawRow = CellValue[];

const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
const SPREADSHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const RELATIONSHIPS_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

const text = (value: CellValue): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const numberValue = (value: CellValue): number => {
  if (typeof value === "number") return value;
  const normalized = text(value).replace(/[^\d.-]/g, "");
  return normalized ? Number(normalized) : 0;
};

const excelDate = (value: CellValue): string => {
  if (value instanceof Date) return value.toLocaleDateString("es-CO");
  if (typeof value !== "number") return text(value);

  const date = new Date(EXCEL_EPOCH.getTime() + value * 24 * 60 * 60 * 1000);
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const extractTopes = (value: string): string[] => {
  const matches = value.match(/Tope\s+\d+/gi) ?? [];
  return [...new Set(matches.map((match) => match.replace(/\s+/g, " ").trim()))];
};

const parseXml = (content: string) => new DOMParser().parseFromString(content, "application/xml");

const directChildren = (element: Element, localName: string) =>
  [...element.children].filter((child) => child.localName === localName);

const firstChild = (element: Element, localName: string) =>
  directChildren(element, localName)[0] ?? null;

const readSharedText = (si: Element): string =>
  [...si.getElementsByTagNameNS(SPREADSHEET_NS, "t")].map((node) => node.textContent ?? "").join("");

const columnIndex = (cellRef: string) => {
  const letters = cellRef.match(/[A-Z]+/)?.[0] ?? "";
  return [...letters].reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
};

const rowIndex = (cellRef: string) => Number(cellRef.match(/\d+/)?.[0] ?? "0") - 1;

const normalizeSheetPath = (target: string) => {
  if (target.startsWith("/")) return target.slice(1);
  return `xl/${target.replace(/^\/?xl\//, "")}`;
};

const getFirstSheetPath = async (zip: JSZip) => {
  const workbookXml = await zip.file("xl/workbook.xml")?.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");

  if (!workbookXml || !relsXml) {
    throw new Error("El archivo no contiene la estructura esperada de un libro Excel.");
  }

  const workbook = parseXml(workbookXml);
  const rels = parseXml(relsXml);
  const firstSheet = workbook.getElementsByTagNameNS(SPREADSHEET_NS, "sheet")[0];
  const relationshipId = firstSheet?.getAttributeNS(OFFICE_REL_NS, "id");

  if (!relationshipId) {
    throw new Error("No fue posible encontrar la primera hoja del archivo.");
  }

  const relationship = [...rels.getElementsByTagNameNS(RELATIONSHIPS_NS, "Relationship")].find(
    (node) => node.getAttribute("Id") === relationshipId,
  );
  const target = relationship?.getAttribute("Target");

  if (!target) {
    throw new Error("No fue posible resolver la ruta de la hoja del archivo.");
  }

  return normalizeSheetPath(target);
};

const getSharedStrings = async (zip: JSZip) => {
  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  if (!sharedStringsXml) return [];

  const doc = parseXml(sharedStringsXml);
  return [...doc.getElementsByTagNameNS(SPREADSHEET_NS, "si")].map(readSharedText);
};

const readCellValue = (cell: Element, sharedStrings: string[]): CellValue => {
  const type = cell.getAttribute("t");

  if (type === "inlineStr") {
    const inlineString = firstChild(cell, "is");
    return inlineString ? readSharedText(inlineString) : "";
  }

  const value = firstChild(cell, "v")?.textContent;

  if (type === "s") {
    if (value === null || value === undefined || value === "") return "";
    return sharedStrings[Number(value)] ?? "";
  }

  if (type === "b") return value === "1";
  if (type === "str") return value ?? "";
  if (value === null || value === undefined || value === "") return "";

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

const readRowsFromSheet = (sheetXml: string, sharedStrings: string[]): RawRow[] => {
  const doc = parseXml(sheetXml);
  const rows: RawRow[] = [];

  [...doc.getElementsByTagNameNS(SPREADSHEET_NS, "c")].forEach((cell) => {
    const ref = cell.getAttribute("r");
    if (!ref) return;

    const row = rowIndex(ref);
    const column = columnIndex(ref);
    rows[row] ??= [];
    rows[row][column] = readCellValue(cell, sharedStrings);
  });

  return rows.map((row) => row ?? []);
};

const readMetadata = (rows: RawRow[]): ReportMetadata => ({
  warning: text(rows[1]?.[0]),
  reportDate: excelDate(rows[1]?.[7]),
  cutoffDate: excelDate(rows[2]?.[2]),
  year: text(rows[3]?.[2]),
  documentType: text(rows[5]?.[2]),
  identification: text(rows[6]?.[2]),
  taxpayerName: text(rows[7]?.[2]),
});

const readThresholds = (rows: RawRow[]): Threshold[] =>
  rows
    .slice(14, 19)
    .map((row, index) => ({
      id: `threshold-${index + 1}`,
      label: text(row[4]),
      value: numberValue(row[5]),
    }))
    .filter((threshold) => threshold.label || threshold.value);

const readRecords = (rows: RawRow[]): ExogenaRecord[] =>
  rows
    .slice(19)
    .map((row, index) => {
      const declarationUse = text(row[6]);
      return {
        id: `record-${index + 1}`,
        reporterNit: text(row[0]),
        reporterName: text(row[1]),
        reportedNit: text(row[2]),
        reportedName: text(row[3]),
        detail: text(row[4]),
        value: numberValue(row[5]),
        declarationUse,
        additionalInfo: text(row[7]),
        topes: extractTopes(declarationUse),
      };
    })
    .filter((record) => record.reporterNit || record.reporterName || record.detail || record.value);

export const parseExogenaWorkbook = async (file: File): Promise<ExogenaReport> => {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const [sheetPath, sharedStrings] = await Promise.all([getFirstSheetPath(zip), getSharedStrings(zip)]);
  const sheetXml = await zip.file(sheetPath)?.async("string");

  if (!sheetXml) {
    throw new Error("No fue posible leer la hoja principal del archivo.");
  }

  const rows = readRowsFromSheet(sheetXml, sharedStrings);

  if (rows.length < 20) {
    throw new Error("El archivo no parece tener el formato esperado de informacion exogena.");
  }

  return {
    fileName: file.name,
    metadata: readMetadata(rows),
    thresholds: readThresholds(rows),
    records: readRecords(rows),
  };
};
