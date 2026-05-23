#!/usr/bin/env bun
/**
 * v0.5 Jargon Sweep
 * Finds user-visible "tech-jargon" strings across talent surfaces
 * and tiers them T1 (blocking) / T2 (decorative) / T3 (code-only).
 *
 * Output: .lovable/v0.5-jargon-hits.md
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const SCOPES = [
  "src/pages/app",
  "src/domains",
  "src/components",
];

// Exclude admin/gro10x/instructor staff surfaces from v0.5 sweep
const EXCLUDE_PATTERNS = [
  /\/admin\//i,
  /\/gro10x\//i,
  /\bAdmin[A-Z]/,
  /Gro10x/,
];

// Banned jargon vocabulary
const JARGON = [
  "Clearance", "Telemetry", "Anomaly", "Sentinel",
  "Synthesis", "Synthetic", "Cognitive",
  "Executive Logic", "Logic Node", "Node Failure",
  "Reasoning Pipeline", "Verified \\w+ Sync",
  "Core (?:Boot|Clearance|Sync)", "Initialize \\w+",
  "Protocol:", "\\bHUD\\b", "Phase [A-Z]\\d",
  "cite:\\s*\\d",
];
const JARGON_RE = new RegExp(`\\b(?:${JARGON.join("|")})\\b`);

// Heuristic: 3+ Capitalized TechWords in a row inside a string
const TECH_CHAIN_RE = /\b([A-Z][a-z]+\s+){2,}[A-Z][a-z]+\b/;

// T1 indicators — string is in a high-visibility location
const T1_PATTERNS = [
  /toast\.(error|success|info|warning|loading)\s*\(/,
  /toast\s*\(/,
  /<h[1-3][\s>]/,
  /(?:loadingText|errorText|emptyText|title|headline|cta)\s*[:=]/i,
  /Loading|Error|Failed|Verifying|Initializing/i,
];

// T2 indicators
const T2_PATTERNS = [
  /<(?:h[4-6]|p|span|label|button|div)[\s>]/,
  /(?:description|subtitle|label|placeholder|alt|ariaLabel|aria-label)\s*[:=]/i,
];

interface Hit {
  file: string;
  line: number;
  tier: "T1" | "T2" | "T3";
  snippet: string;
  match: string;
}

function getFiles(): string[] {
  const cmd = `rg -l -g '*.{ts,tsx,js,jsx}' -e '${JARGON.join("|")}' ${SCOPES.join(" ")}`;
  try {
    const out = execSync(cmd, { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
    return out.trim().split("\n").filter(Boolean).filter(f => !EXCLUDE_PATTERNS.some(p => p.test(f)));
  } catch {
    return [];
  }
}

function classify(file: string, lineText: string, prevLines: string[]): "T1" | "T2" | "T3" {
  // Inside a string literal?
  const inString = /["'`][^"'`]*["'`]/.test(lineText);
  if (!inString) return "T3";

  // Skip pure comments
  if (/^\s*(\/\/|\*|\/\*)/.test(lineText)) return "T3";

  // Skip imports, type defs, hook/var names
  if (/^\s*(import|export|type|interface|const \w+\s*=\s*(use|create))/.test(lineText)) return "T3";

  const context = [...prevLines.slice(-3), lineText].join("\n");

  if (T1_PATTERNS.some(p => p.test(context))) return "T1";
  if (T2_PATTERNS.some(p => p.test(context))) return "T2";

  // String literal with jargon but unclear location — default T2 to be safe
  return "T2";
}

function scan(): Hit[] {
  const hits: Hit[] = [];
  const files = getFiles();

  for (const file of files) {
    let content: string;
    try { content = readFileSync(file, "utf8"); } catch { continue; }
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(JARGON_RE) || line.match(TECH_CHAIN_RE);
      if (!m) continue;

      // must be inside quotes
      const quoted = line.match(/["'`]([^"'`]*)["'`]/g) || [];
      const inQuotedString = quoted.some(q => JARGON_RE.test(q) || TECH_CHAIN_RE.test(q));
      if (!inQuotedString) continue;

      const tier = classify(file, line, lines.slice(Math.max(0, i - 3), i));
      if (tier === "T3") continue; // skip code-only for v0.5

      hits.push({
        file,
        line: i + 1,
        tier,
        snippet: line.trim().slice(0, 160),
        match: m[0],
      });
    }
  }
  return hits;
}

function report(hits: Hit[]): string {
  const byTier: Record<string, Hit[]> = { T1: [], T2: [] };
  for (const h of hits) byTier[h.tier].push(h);

  const groupByFile = (arr: Hit[]) => {
    const g: Record<string, Hit[]> = {};
    for (const h of arr) (g[h.file] ||= []).push(h);
    return g;
  };

  let md = `# v0.5 Jargon Sweep — Hit List\n\n`;
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += `**Total user-visible hits:** ${hits.length}\n`;
  md += `- T1 (user-blocking): ${byTier.T1.length} hits in ${new Set(byTier.T1.map(h => h.file)).size} files\n`;
  md += `- T2 (decorative): ${byTier.T2.length} hits in ${new Set(byTier.T2.map(h => h.file)).size} files\n\n`;
  md += `Scope: talent surfaces only. Admin / Gro10x / instructor staff routes excluded.\n\n`;

  for (const tier of ["T1", "T2"] as const) {
    md += `\n---\n\n## ${tier} — ${tier === "T1" ? "User-blocking (FIX FIRST)" : "Decorative (fix in pass 3)"}\n\n`;
    const g = groupByFile(byTier[tier]);
    const sortedFiles = Object.keys(g).sort((a, b) => g[b].length - g[a].length);
    for (const file of sortedFiles) {
      md += `### \`${file}\` (${g[file].length})\n`;
      for (const h of g[file]) {
        md += `- L${h.line} \`${h.match}\` — ${h.snippet.replace(/`/g, "\\`")}\n`;
      }
      md += `\n`;
    }
  }
  return md;
}

const hits = scan();
mkdirSync(".lovable", { recursive: true });
writeFileSync(".lovable/v0.5-jargon-hits.md", report(hits));
console.log(`Wrote .lovable/v0.5-jargon-hits.md — ${hits.length} hits (T1: ${hits.filter(h => h.tier === "T1").length}, T2: ${hits.filter(h => h.tier === "T2").length})`);
