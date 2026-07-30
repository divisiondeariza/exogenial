export type ExogenaRecord = {
  id: string;
  reporterNit: string;
  reporterName: string;
  reportedNit: string;
  reportedName: string;
  detail: string;
  value: number;
  declarationUse: string;
  additionalInfo: string;
  topes: string[];
};

export type Threshold = {
  id: string;
  label: string;
  value: number;
};

export type ReportMetadata = {
  year: string;
  reportDate: string;
  cutoffDate: string;
  documentType: string;
  identification: string;
  taxpayerName: string;
  warning: string;
};

export type ExogenaReport = {
  fileName: string;
  metadata: ReportMetadata;
  thresholds: Threshold[];
  records: ExogenaRecord[];
};

export type SortKey = "value" | "reporterName" | "detail";
