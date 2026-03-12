// LinkedIn Profile Scraper / Leads-Finder JSON → Talent / Contact / Investor parser
// Supports two formats: camelCase (old scraper) and snake_case (new leads-finder)

export interface LinkedInProfile {
  // Old scraper (camelCase)
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

  // New leads-finder (snake_case)
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  mobile_number?: string | null;
  personal_email?: string | null;
  linkedin?: string | null;
  job_title?: string | null;
  industry?: string | null;
  seniority_level?: string | null;
  functional_level?: string | null;
  company_name?: string | null;
  company_website?: string | null;
  company_linkedin?: string | null;
  company_size?: number | null;
  company_description?: string | null;
  company_founded_year?: number | null;
  company_phone?: string | null;
  company_full_address?: string | null;
  company_street_address?: string | null;
  company_city?: string | null;
  company_state?: string | null;
  company_country?: string | null;
  company_domain?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  keywords?: string | null;

  [key: string]: any;
}

export interface CompanyData {
  name: string;
  website?: string | null;
  linkedin_url?: string | null;
  industry?: string | null;
  address?: string | null;
  notes?: string | null;
  primary_email?: string | null;
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

// ─── FORMAT DETECTION ───────────────────────────────────────

function isLeadsFinderFormat(p: LinkedInProfile): boolean {
  return 'first_name' in p || 'job_title' in p || ('linkedin' in p && !('linkedinUrl' in p));
}

// ─── FIELD EXTRACTORS ───────────────────────────────────────

function getName(p: LinkedInProfile): string {
  return (
    p.full_name ||
    p.fullName ||
    [p.first_name || p.firstName, p.last_name || p.lastName].filter(Boolean).join(" ") ||
    ""
  ).trim();
}

function getLinkedInUrl(p: LinkedInProfile): string | null {
  return p.linkedin || p.linkedinUrl || p.linkedinPublicUrl || null;
}

function getPhone(p: LinkedInProfile): string | null {
  const raw = p.mobile_number ?? p.mobileNumber;
  if (!raw) return null;
  const phone = String(raw).trim();
  return phone || null;
}

function getEmail(p: LinkedInProfile): string | null {
  const primary = p.email?.trim();
  if (primary) return primary;
  const personal = p.personal_email?.trim();
  if (personal) return personal;
  return null;
}

function getCountry(p: LinkedInProfile): string | null {
  // New format has direct country field
  if (p.country) return p.country;
  // Old format: parse from address
  const addr = p.addressCountryOnly || p.addressWithCountry;
  if (!addr) return null;
  const parts = addr.split(",").map((s) => s.trim());
  return parts[parts.length - 1] || null;
}

function getCity(p: LinkedInProfile): string | null {
  return p.city || null;
}

function getHeadline(p: LinkedInProfile): string | null {
  return p.headline || p.job_title || p.jobTitle || null;
}

function getCompanyName(p: LinkedInProfile): string | null {
  return p.company_name || p.companyName || null;
}

function extractCompanyData(p: LinkedInProfile): CompanyData | null {
  const name = getCompanyName(p);
  if (!name) return null;
  return {
    name,
    website: p.company_website || null,
    linkedin_url: p.company_linkedin || null,
    industry: p.industry || p.companyIndustry || null,
    address: p.company_full_address || p.company_street_address || null,
    notes: p.company_description || null,
    primary_email: null,
  };
}

function mapKeywordsToSkills(p: LinkedInProfile): string[] | null {
  // New format: keywords is a comma-separated string
  if (p.keywords) {
    return p.keywords.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // Old format: skills array
  return mapSkills(p.skills || []);
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
    const email = getEmail(p);

    if (!email) warnings.push("No email");

    const skills = mapKeywordsToSkills(p);
    const education = mapEducations(p.educations || []);
    const experience = mapExperiences(p.experiences || []);

    const data: Record<string, any> = {
      full_name: name,
      email: email || `placeholder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@linkedin-import.local`,
      phone: getPhone(p),
      linkedin_url: getLinkedInUrl(p),
      custom_profession: getHeadline(p),
      country: getCountry(p),
      profile_photo_url: p.profilePicHighQuality || p.profilePic || null,
      education,
      experience,
      skills,
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
    const email = getEmail(p);
    if (!email) warnings.push("No email");

    const data: Record<string, any> = {
      full_name: name,
      email: email || null,
      phone: getPhone(p),
      designation: getHeadline(p),
      linkedin_url: getLinkedInUrl(p),
      source: "linkedin_import",
      notes: p.about || null,
      _companyName: getCompanyName(p),
      _companyData: extractCompanyData(p),
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
    const email = getEmail(p);
    if (!email) warnings.push("No email");

    const data: Record<string, any> = {
      full_name: name,
      email: email || null,
      phone: getPhone(p),
      title: getHeadline(p),
      linkedin_url: getLinkedInUrl(p),
      relationship_summary: p.about || null,
      subscription_status: "pending",
      _companyName: getCompanyName(p),
      _companyData: extractCompanyData(p),
    };

    valid.push({ data, warnings, raw: p });
  }

  return { valid, skipped };
}
