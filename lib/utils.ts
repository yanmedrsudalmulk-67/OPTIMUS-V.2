import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTarget(
  target: string | number | null | undefined, 
  measurementUnit?: string, 
  reverse?: boolean
): string {
  if (target === null || target === undefined) {
    return "-";
  }

  const str = String(target).trim();
  if (str === "" || str === "null" || str === "undefined" || str === "—" || str === "-") {
    return "-";
  }

  // Check for comparison symbols
  const hasSymbol = str.match(/[≥≤<>=]/);
  let compSymbol = "";
  if (hasSymbol) {
    compSymbol = hasSymbol[0];
  } else {
    compSymbol = reverse ? "≤" : "≥";
  }

  // Clean comparison symbol, whitespace, percent sign
  let cleanStr = str.replace(/[≥≤<>=]/g, "").trim();
  const hasPercent = cleanStr.includes("%") || (measurementUnit && measurementUnit.toLowerCase().includes("persen"));
  cleanStr = cleanStr.replace(/%/g, "").trim();

  const parsed = parseFloat(cleanStr);
  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    // If it's something general like "24 jam" already written, return it
    return str;
  }

  // Determine suffix
  let unitSuffix = "";
  const unitLower = (measurementUnit || "").toLowerCase();

  if (hasPercent || unitLower.includes("persen") || unitLower.includes("%")) {
    unitSuffix = "%";
  } else if (unitLower.includes("menit")) {
    unitSuffix = "menit";
  } else if (unitLower.includes("jam")) {
    unitSuffix = "jam";
  } else if (unitLower.includes("rasio")) {
    unitSuffix = "rasio";
  } else {
    // Fallback to percent if standard
    unitSuffix = "%";
  }

  if (parsed === 100 && !hasSymbol) {
    return `100 %`;
  }

  return `${compSymbol} ${parsed} ${unitSuffix}`.trim();
}
