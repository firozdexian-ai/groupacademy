import { useMemo } from "react";
import { format, isValid } from "date-fns";

/**
 * GroUp Academy: Institutional Scorecard PDF Blueprint (V5.6.0)
 * CTO Reference: Authoritative off-screen printable DOM blueprint optimized for canvas serialization.
 * Architecture: Reference-stable temporal anchoring guaranteeing copyright and data token continuity.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface Assessment {
  id: string;
  full_name: string;
  email: string;
  percentage: number;
  readiness_level: string;
  total_score: number;
  max_score: number;
  created_at: string;
  ai_analysis: any;
  improvement_areas: string[];
  profession_categories?: {
    name: string;
  };
}

const READINESS_REGISTRY: Record<string, string> = {
  beginner: "BEGINNER_NODE",
  developing: "DEVELOPING_SYNC",
  competent: "COMPETENT_CORE",
  proficient: "PROFICIENT_OPS",
  expert: "EXECUTIVE_EXPERT",
};

const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  warning: "#EA580C",
  dark: "#0F172A",
  muted: "#64748B",
  background: "#F8FAFC",
};

export function ScorecardPDFTemplate({ assessment }: { assessment: Assessment }) {
  // --- PHASE: SAFE_TEMPORAL_LEDGER_RESOLUTION ---
  const normalizedTemporalContext = useMemo(() => {
    const rawCreationDateString = assessment?.created_at;
    if (!rawCreationDateString) {
      return { formattedDate: "00_JAN_0000", structuralYear: "2026" };
    }

    const parsedDateInstance = new Date(rawCreationDateString);
    if (!isValid(parsedDateInstance)) {
      return { formattedDate: "SYNC_ERROR", structuralYear: "2026" };
    }

    try {
      return {
        formattedDate: String(format(parsedDateInstance, "dd_MMM_yyyy")).toUpperCase(),
        // Architecture Fix: Anchor structural copyright parameters to immutable record timestamps, never client wall-clocks
        structuralYear: String(parsedDateInstance.getFullYear()),
      };
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Failed to process document temporal markers.", err);
      return { formattedDate: "COMPILATION_ERROR", structuralYear: "2026" };
    }
  }, [assessment?.created_at]);

  // --- PHASE: TEXT_DESIGNATION_SANITIZATION ---
  const sanitizedStringsLedger = useMemo(() => {
    const rawFullName = String(assessment?.full_name || "ANONYMOUS_TALENT_NODE").trim();
    const rawCategoryName = String(assessment?.profession_categories?.name || "CORE_GENERAL").trim();

    return {
      fullNameUppercase: rawFullName.toUpperCase(),
      // Architecture Fix: Globally capture and convert all empty white-spaces smoothly into strict underscores
      categoryNameUppercase: rawCategoryName.replace(/\s+/g, "_").toUpperCase(),
      readinessKey: String(assessment?.readiness_level || "beginner")
        .toLowerCase()
        .trim(),
    };
  }, [assessment?.full_name, assessment?.profession_categories, assessment?.readiness_level]);

  return (
    <div
      id="scorecard-pdf-content"
      style={{
        width: "794px", // Autoritative A4 Dimensions at standard 96 DPI pixel scale bounds
        padding: "50px",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px", // Positioned cleanly outside standard user viewports for background generation engine captures
        top: 0,
        boxSizing: "border-box",
      }}
    >
      {/* HUD: DOCUMENT_HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "40px",
          paddingBottom: "25px",
          borderBottom: `4px solid ${BRAND.primary}`,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 900,
              color: BRAND.primary,
              letterSpacing: "-1px",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            GroUp_Academy
          </h1>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: "14px",
              fontWeight: 700,
              color: BRAND.muted,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Career_Readiness_Scorecard
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "11px", color: BRAND.muted, fontFamily: "monospace" }}>
          <p style={{ margin: 0, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
            Uplink_Timestamp
          </p>
          <p style={{ margin: "2px 0 0", fontWeight: 700, color: BRAND.dark, fontSize: "12px" }}>
            {normalizedTemporalContext.formattedDate}
          </p>
        </div>
      </div>

      {/* COMPONENT: CANDIDATE_METADATA_ROW */}
      <div
        style={{
          backgroundColor: BRAND.background,
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1, paddingRight: "20px" }}>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 800,
                color: BRAND.muted,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Identity_Artifact
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800, color: BRAND.dark }}>
              {sanitizedStringsLedger.fullNameUppercase}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 800,
                color: BRAND.muted,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Trajectory_Key
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 700, color: BRAND.primary }}>
              {sanitizedStringsLedger.categoryNameUppercase}
            </p>
          </div>
        </div>
      </div>

      {/* HUD: SCORE_METRIC_CENTER_PANEL */}
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
          borderRadius: "30px",
          marginBottom: "30px",
          color: "#ffffff",
          boxShadow: "0 20px 40px rgba(42, 125, 222, 0.15)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "3px",
            opacity: 0.9,
          }}
        >
          Neural_Readiness_Index
        </p>
        <p
          style={{
            margin: "15px 0",
            fontSize: "90px",
            fontWeight: 900,
            lineHeight: 1,
            fontStyle: "italic",
            letterSpacing: "-4px",
          }}
        >
          {Number(assessment?.percentage || 0)}%
        </p>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            padding: "10px 30px",
            borderRadius: "15px",
            fontSize: "14px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "2px",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          {READINESS_REGISTRY[sanitizedStringsLedger.readinessKey] || "BEGINNER_NODE"}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "60px",
            marginTop: "30px",
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "monospace",
          }}
        >
          <div style={{ opacity: 0.9 }}>
            SYNAPSE_YIELD:{" "}
            <span style={{ color: "#ffffff", fontWeight: 800 }}>{Number(assessment?.total_score || 0)}</span>
          </div>
          <div style={{ opacity: 0.9 }}>
            REGISTRY_MAX:{" "}
            <span style={{ color: "#ffffff", fontWeight: 800 }}>{Number(assessment?.max_score || 100)}</span>
          </div>
        </div>
      </div>

      {/* VIEWPORT: ANALYTICAL_INSIGHTS_GRID */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "30px" }}>
        {/* Metric Sector: Strengths */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#F0FDF4",
            padding: "20px",
            borderRadius: "20px",
            border: `1px solid rgba(16, 213, 118, 0.2)`,
          }}
        >
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: "13px",
              fontWeight: 800,
              color: BRAND.accent,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            [+] Sync_Strengths
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "15px",
              fontSize: "12px",
              lineHeight: 1.8,
              color: BRAND.dark,
              fontWeight: 500,
            }}
          >
            {assessment?.ai_analysis?.strengths?.slice(0, 4).map((strengthText: string, idx: number) => (
              <li key={`strength-node-${idx}`} style={{ marginBottom: "8px" }}>
                {String(strengthText)}
              </li>
            )) || (
              <li style={{ color: BRAND.muted, listStyleType: "none" }}>
                Waiting for analytical metrics compilation...
              </li>
            )}
          </ul>
        </div>

        {/* Metric Sector: Improvements */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#FFF7ED",
            padding: "20px",
            borderRadius: "20px",
            border: `1px solid rgba(234, 88, 12, 0.2)`,
          }}
        >
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: "13px",
              fontWeight: 800,
              color: BRAND.warning,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            [△] Optimization_Nodes
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "15px",
              fontSize: "12px",
              lineHeight: 1.8,
              color: BRAND.dark,
              fontWeight: 500,
            }}
          >
            {(assessment?.ai_analysis?.improvement_areas || assessment?.improvement_areas)
              ?.slice(0, 4)
              .map((improvementText: string, idx: number) => (
                <li key={`improvement-node-${idx}`} style={{ marginBottom: "8px" }}>
                  {String(improvementText)}
                </li>
              )) || (
              <li style={{ color: BRAND.muted, listStyleType: "none" }}>Waiting for calibration parameters...</li>
            )}
          </ul>
        </div>
      </div>

      {/* HUD: ACTIONABLE_RECOMMENDATIONS_ENGINE */}
      {assessment?.ai_analysis?.recommendations && (
        <div style={{ marginBottom: "35px", padding: "25px", border: "2px solid #f1f5f9", borderRadius: "24px" }}>
          <h3
            style={{
              margin: "0 0 15px",
              fontSize: "13px",
              fontWeight: 800,
              color: BRAND.primary,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Strategic_Deployment_Blueprint
          </h3>
          <div style={{ fontSize: "12px", lineHeight: 1.8, color: BRAND.dark, fontWeight: 500 }}>
            {assessment.ai_analysis.recommendations.slice(0, 4).map((recommendationText: string, idx: number) => (
              <div
                key={`rec-node-${idx}`}
                style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "flex-start" }}
              >
                <span style={{ color: BRAND.primary, fontWeight: 900, fontFamily: "monospace" }}>0{idx + 1}.</span>
                <span>{String(recommendationText)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER: SYSTEM_ARTIFACT_DATA_LEDGER */}
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "9px",
          color: BRAND.muted,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1px",
          fontFamily: "monospace",
        }}
      >
        <div>
          <p style={{ margin: 0 }}>Artifact_ID: {String(assessment?.id || "N/A").toUpperCase()}</p>
          <p style={{ margin: "4px 0 0", color: BRAND.primary }}>Verification_Status: SYSTEM_VERIFIED</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Generated_By: GroUp_Academy_Neural_Engine</p>
          <p style={{ margin: "4px 0 0" }}>© {normalizedTemporalContext.structuralYear} ALL_RIGHTS_RESERVED</p>
        </div>
      </div>
    </div>
  );
}
