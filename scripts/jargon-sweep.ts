#!/usr/bin/env bun
/**
 * v0.5 Jargon Sweep Engine
 *
 * Scans user-visible copy strings across production talent surfaces
 * to locate tech-jargon and group them into actionable priority levels.
 *
 * Operational Scope: Talent-facing app routes only.
 * System Protection: B2B, Admin dashboard, and staff views are safely bypassed.
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

// Target operational paths to check
const PRODUCTION_SCAN_TARGETS = ["src/pages/app", "src/domains", "src/components"];

// Isolation rules to preserve internal administrative infrastructure boundaries
const ADMINISTRATIVE_BYPASS_PATTERNS = [/\/admin\//i, /\/gro10x\//i, /\bAdmin[A-Z]/, /Gro10x/];

// Screen keywords to replace with clear, student-friendly SaaS copy
const REPLACEMENT_LOOKUP_KEYWORDS = [
  "Clearance",
  "Telemetry",
  "Anomaly",
  "Sentinel",
  "Synthesis",
  "Synthetic",
  "Cognitive",
  "Executive Logic",
  "Logic Node",
  "Node Failure",
  "Reasoning Pipeline",
  "Verified \\w+ Sync",
  "Core (?:Boot|Clearance|Sync)",
  "Initialize \\w+",
  "Protocol:",
  "\\bHUD\\b",
  "Phase [A-Z]\\d",
  "cite:\\s*\\d",
];

// Optimized engine pattern matcher
const JARGON_DETECTION_ENGINE = new RegExp(`\\b(?:${REPLACEMENT_LOOKUP_KEYWORDS.join("|")})\\b`);

// Performance refinement: identify consecutive capitalized words in copy blocks
const capitalizedWordChainPattern = /\b([A-Z][a-z]+\s+){2,}[A-Z][a-z]+\b/;

// High Priority targets - critical messaging, notifications, alerts, or core headers
const HIGH_PRIORITY_ELEMENTS = [
  /toast\.(error|success|info|warning|loading)\s*\(/,
  /toast\s*\(/,
  /<h[1-3][\s>]/,
  /(?:loadingText|errorText|emptyText|title|headline|cta)\s*[:=]/i,
  /Loading|Error|Failed|Verifying|Initializing/i,
];

// Secondary Review targets - standard inline labels, inputs, text spans, or captions
const STANDARD_REVIEW_ELEMENTS = [
  /<(?:h4|h5|h6|p|span|label|button|div)[\s>]/,
  /(?:description|subtitle|label|placeholder|alt|ariaLabel|aria-label)\s*[:=]/i,
];

interface ProductionCopyHit {
  filePath: string;
  lineNumber: number;
  priorityLevel: "Urgent" | "Standard" | "InternalCode";
  textPreview: string;
  detectedJargon: string;
}

/**
 * Executes a fast text search query through project files using ripgrep.
 * Gracefully defaults to an empty layout if the folder structure changes.
 */
function fetchProjectFiles(): string[] {
  const queryCommand = `rg -l -g '*.{ts,tsx,js,jsx}' -e '${REPLACEMENT_LOOKUP_KEYWORDS.join("|")}' ${PRODUCTION_SCAN_TARGETS.join(" ")}`;
  try {
    const rawOutput = execSync(queryCommand, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    return rawOutput
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((file) => !ADMINISTRATIVE_BYPASS_PATTERNS.some((pattern) => pattern.test(file)));
  } catch (error) {
    // Graceful check degradation for missing folders or zero hits to prevent terminal failure
    return [];
  }
}

/**
 * Investigates context lines to determine whether strings are system data or user copy.
 */
function assignPriorityLevel(
  filePath: string,
  activeLine: string,
  lineHistory: string[],
): "Urgent" | "Standard" | "InternalCode" {
  // Verify characters are caught within valid string markers
  const containsStringLiteral = /["'`][^"'`]*["'`]/.test(activeLine);
  if (!containsStringLiteral) return "InternalCode";

  // Bypass system comments
  if (/^\s*(\/\/|\*|\/\*)/.test(activeLine)) return "InternalCode";

  // Bypass code layout declarations, module imports, configuration hooks, or variables
  if (/^\s*(import|export|type|interface|const \w+\s*=\s*(use|create))/.test(activeLine)) return "InternalCode";

  const analyticalContextBlock = [...lineHistory.slice(-3), activeLine].join("\n");

  if (HIGH_PRIORITY_ELEMENTS.some((pattern) => pattern.test(analyticalContextBlock))) return "Urgent";
  if (STANDARD_REVIEW_ELEMENTS.some((pattern) => pattern.test(analyticalContextBlock))) return "Standard";

  // Fallback category to capture remaining non-standard strings safely
  return "Standard";
}

/**
 * Scans active text buffers across discovered project layouts.
 */
function runJargonSweep(): ProductionCopyHit[] {
  const trackedHits: ProductionCopyHit[] = [];
  const validFilesList = fetchProjectFiles();

  for (const targetFile of validFilesList) {
    let rawFileContent: string;
    try {
      rawFileContent = readFileSync(targetFile, "utf8");
    } catch {
      continue;
    }

    const individualLines = rawFileContent.split("\n");

    for (let index = 0; index < individualLines.length; index++) {
      const currentLineText = individualLines[index];
      const locatedKeywordMatch =
        currentLineText.match(JARGON_DETECTION_ENGINE) || currentLineText.match(capitalizedWordChainPattern);
      if (!locatedKeywordMatch) continue;

      // Ensure verification match falls strictly within quote boundaries
      const extractedQuotes = currentLineText.match(/["'`]([^"'`]*)["'`]/g) || [];
      const isStringContentMatch = extractedQuotes.some(
        (quoteBlock) => JARGON_DETECTION_ENGINE.test(quoteBlock) || capitalizedWordChainPattern.test(quoteBlock),
      );
      if (!isStringContentMatch) continue;

      const contextualHistory = individualLines.slice(Math.max(0, index - 3), index);
      const computedPriority = assignPriorityLevel(targetFile, currentLineText, contextualHistory);

      if (computedPriority === "InternalCode") continue;

      trackedHits.push({
        filePath: targetFile,
        lineNumber: index + 1,
        priorityLevel: computedPriority,
        textPreview: currentLineText.trim().slice(0, 160),
        detectedJargon: locatedKeywordMatch[0],
      });
    }
  }
  return trackedHits;
}

/**
 * Compiles report findings into a pristine markdown layout matching the platform dashboard style.
 */
function compileSummaryMarkdown(discoveredHits: ProductionCopyHit[]): string {
  const segmentedHits: Record<string, ProductionCopyHit[]> = { Urgent: [], Standard: [] };
  for (const hit of discoveredHits) {
    segmentedHits[hit.priorityLevel].push(hit);
  }

  const groupHitsByFilePath = (dataset: ProductionCopyHit[]) => {
    const fileMapping: Record<string, ProductionCopyHit[]> = {};
    for (const hitItem of dataset) {
      (fileMapping[hitItem.filePath] ||= []).push(hitItem);
    }
    return fileMapping;
  };

  let outputReportMarkdown = `# Production UI Jargon Audit — Action Plan\n\n`;
  outputReportMarkdown += `Generated: ${new Date().toISOString()}\n\n`;
  outputReportMarkdown += `**Total User-Visible Clean Targets Found:** ${discoveredHits.length}\n`;
  outputReportMarkdown += `- Urgent Actions (High-Visibility Views): ${segmentedHits.Urgent.length} items across ${new Set(segmentedHits.Urgent.map((h) => h.filePath)).size} files\n`;
  outputReportMarkdown += `- Standard Review (Inline Text Labels): ${segmentedHits.Standard.length} items across ${new Set(segmentedHits.Standard.map((h) => h.filePath)).size} files\n\n`;
  outputReportMarkdown += `Scope: Verified talent surfaces only. Administrative, workplace, and partner tools are preserved natively.\n\n`;

  for (const sectionLevel of ["Urgent", "Standard"] as const) {
    const displayTitle = sectionLevel === "Urgent" ? "Urgent Actions (Fix First)" : "Standard Review (Fix in Pass 3)";
    outputReportMarkdown += `\n---\n\n## ${displayTitle}\n\n`;

    const fileGroupedData = groupHitsByFilePath(segmentedHits[sectionLevel]);
    const sortedFilePaths = Object.keys(fileGroupedData).sort(
      (firstFile, secondFile) => fileGroupedData[secondFile].length - fileGroupedData[firstFile].length,
    );

    for (const activePath of sortedFilePaths) {
      outputReportMarkdown += `### \`${activePath}\` (${fileGroupedData[activePath].length})\n`;
      for (const lineHit of fileGroupedData[activePath]) {
        outputReportMarkdown += `- Line ${lineHit.lineNumber} \`${lineHit.detectedJargon}\` — ${lineHit.textPreview.replace(/`/g, "\\`")}\n`;
      }
      outputReportMarkdown += `\n`;
    }
  }
  return outputReportMarkdown;
}

// Execute analysis pipeline safely
const discoveredJargonHits = runJargonSweep();
mkdirSync(".lovable", { recursive: true });
writeFileSync(".lovable/v0.5-jargon-hits.md", compileSummaryMarkdown(discoveredJargonHits));

console.log(
  `Successfully compiled audit registry to .lovable/v0.5-jargon-hits.md — Found ${discoveredJargonHits.length} items.`,
);
