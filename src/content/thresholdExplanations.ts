import { parse } from "yaml";
import rawThresholdExplanations from "./thresholdExplanations.yaml?raw";
import type { Threshold } from "../types";

export type ThresholdExplanation = {
  title: string;
  meaning: string;
  declarationEffect: string;
  taxEffect: string;
  sources: { label: string; url: string }[];
};

const thresholdExplanations = parse(rawThresholdExplanations) as Record<string, ThresholdExplanation>;

export const getThresholdExplanation = (threshold: Threshold) => {
  const key = threshold.label.match(/Tope\s+(\d+)/i)?.[1];
  return key ? thresholdExplanations[key] : undefined;
};
