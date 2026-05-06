/**
 * Compute a stable SHA-256 fingerprint of a parsed CV so we can detect
 * the same résumé being uploaded under multiple accounts.
 *
 * The fingerprint deliberately ignores formatting / file metadata and
 * focuses on the *substance* of the CV: skills, work history, schooling.
 */

export interface FingerprintInput {
  skills?: string[];
  experience?: Array<{ company?: string; title?: string }>;
  education?: Array<{ institution?: string; degree?: string }>;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function buildFingerprintBasis(parsed: FingerprintInput): string {
  const skills = (parsed.skills ?? []).map(norm).filter(Boolean).sort();

  const exp = (parsed.experience ?? [])
    .map((e) => `${norm(e.company)}|${norm(e.title)}`)
    .filter((s) => s !== "|")
    .sort();

  const edu = (parsed.education ?? [])
    .map((e) => `${norm(e.institution)}|${norm(e.degree)}`)
    .filter((s) => s !== "|")
    .sort();

  return [skills.join(","), exp.join(";"), edu.join(";")].join("::");
}

export async function computeCVFingerprint(parsed: FingerprintInput): Promise<string | null> {
  const basis = buildFingerprintBasis(parsed);
  // Need at least *some* signal to avoid hashing an empty payload
  if (basis.replace(/[:,;|]/g, "").trim().length < 24) return null;

  const buf = new TextEncoder().encode(basis);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
