// LinkedIn Profile Scraper JSON → Talent / Contact / Investor parser

export interface LinkedInProfile {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  mobileNumber?: string | null;
  headline?: string | null;
  linkedinUrl?: string | null;
  linkedinPublicUrl?: string | null;
  companyName?: string | null;
  addressWithCountry?: string | null;
  addressCountryOnly?: string | null;
  profilePicHighQuality?: string | null;
  profilePic?: string | null;
  about?: string | null;
  experiences?: any[];
  educations?: any[];
  skills?: any[];
  jobTitle?: string | null;
  companyIndustry?: string | null;
  connections?: number | null;
  isJobSeeker?: boolean | null;
  [key: string]: any;
}

export interface ParsedRecord {
  data: Record<string, any>;
  warnings: string[];
  raw: LinkedInProfile;
}

export interface SkippedRecord {
  name: string;
  reason: string;
  raw: LinkedInProfile;
}

export interface ParseResult<T = Record<string, any>> {
  valid: ParsedRecord[];
  skipped: SkippedRecord[];
}

function getName(p: LinkedInProfile): string {
  return (p.fullName || [p.firstName, p.lastName].filter(Boolean).join(" ") || "").trim();
}

function getLinkedInUrl(p: LinkedInProfile): string | null {
  return p.linkedinUrl || p.linkedinPublicUrl || null;
}

function getPhone(p: LinkedInProfile): string | null {
  if (!p.mobileNumber) return null;
  const phone = String(p.mobileNumber).trim();
  return phone || null;
}

function parseCountry(p: LinkedInProfile): string | null {
  const addr = p.addressCountryOnly || p.addressWithCountry;
  if (!addr) return null;
  // Take last part after comma as country
  const parts = addr.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || null;
}

function mapEducations(educations: any[]): any[] | null {
  if (!educations || educations.length === 0) return null;
  return educations.map((e) => ({
    institution: e.schoolName || e.school || e.name || null,
    degree: e.degree || e.degreeName || null,
    field_of_study: e.fieldOfStudy || e.field || null,
    start_year: e.startDate?.year || e.startYear || null,
    end_year: e.endDate?.year || e.endYear || null,
  }));
}

function mapExperiences(experiences: any[]): any[] | null {
  if (!experiences || experiences.length === 0) return null;
  return experiences.map((e) => ({
    company: e.companyName || e.company || null,
    title: e.title || e.jobTitle || null,
    location: e.locationName || e.location || null,
    start_date: e.startDate ? `${e.startDate.year || ""}-${String(e.startDate.month || 1).padStart(2, "0")}` : null,
    end_date: e.endDate ? `${e.endDate.year || ""}-${String(e.endDate.month || 1).padStart(2, "0")}` : null,
    description: e.description || null,
    is_current: e.isCurrent || false,
  }));
}

function mapSkills(skills: any[]): any[] | null {
  if (!skills || skills.length === 0) return null;
  return skills.map((s) => (typeof s === "string" ? s : s.name || s.skill || String(s)));
}

// ─── TALENTS ────────────────────────────────────────────────

export function parseLinkedInForTalents(profiles: LinkedInProfile[]): ParseResult {
  const valid: ParsedRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (const p of profiles) {
    const name = getName(p);
    if (!name) {
      skipped.push({ name: "(unnamed)", reason: "Missing name", raw: p });
      continue;
    }

    const warnings: string[] = [];
    const email = p.email?.trim();

    if (!email) warnings.push("No email");

    const data: Record<string, any> = {
      full_name: name,
      email: email || `placeholder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@linkedin-import.local`,
      phone: getPhone(p),
      linkedin_url: getLinkedInUrl(p),
      custom_profession: p.headline || null,
      country: parseCountry(p),
      profile_photo_url: p.profilePicHighQuality || p.profilePic || null,
      education: mapEducations(p.educations || []),
      experience: mapExperiences(p.experiences || []),
      skills: mapSkills(p.skills || []),
      current_status: p.isJobSeeker ? "job_seeking" : null,
    };

    // Set first education institution/field if available
    if (data.education && data.education.length > 0) {
      data.institution = data.education[0].institution;
      data.field_of_study = data.education[0].field_of_study;
    }

    if (!email) data._hasPlaceholderEmail = true;

    valid.push({ data, warnings, raw: p });
  }

  return { valid, skipped };
}

// ─── CONTACTS ───────────────────────────────────────────────

export function parseLinkedInForContacts(profiles: LinkedInProfile[]): ParseResult {
  const valid: ParsedRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (const p of profiles) {
    const name = getName(p);
    if (!name) {
      skipped.push({ name: "(unnamed)", reason: "Missing name", raw: p });
      continue;
    }

    const warnings: string[] = [];
    if (!p.email) warnings.push("No email");

    const data: Record<string, any> = {
      full_name: name,
      email: p.email?.trim() || null,
      phone: getPhone(p),
      designation: p.headline || p.jobTitle || null,
      linkedin_url: getLinkedInUrl(p),
      source: "linkedin_import",
      notes: p.about || null,
      _companyName: p.companyName || null, // for resolution
    };

    valid.push({ data, warnings, raw: p });
  }

  return { valid, skipped };
}

// ─── INVESTORS ──────────────────────────────────────────────

export function parseLinkedInForInvestors(profiles: LinkedInProfile[]): ParseResult {
  const valid: ParsedRecord[] = [];
  const skipped: SkippedRecord[] = [];

  for (const p of profiles) {
    const name = getName(p);
    if (!name) {
      skipped.push({ name: "(unnamed)", reason: "Missing name", raw: p });
      continue;
    }

    const warnings: string[] = [];
    if (!p.email) warnings.push("No email");

    const data: Record<string, any> = {
      full_name: name,
      email: p.email?.trim() || null,
      phone: getPhone(p),
      title: p.headline || p.jobTitle || null,
      linkedin_url: getLinkedInUrl(p),
      relationship_summary: p.about || null,
      subscription_status: "pending",
      _companyName: p.companyName || null, // for VC firm resolution
    };

    valid.push({ data, warnings, raw: p });
  }

  return { valid, skipped };
}
