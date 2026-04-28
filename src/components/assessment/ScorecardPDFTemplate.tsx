import { format } from "date-fns";

/**
 * GroUp Academy: Institutional Scorecard PDF Blueprint
 * CTO Reference: Authoritative template for high-fidelity PDF artifact generation.
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
  const readinessKey = assessment.readiness_level?.toLowerCase() || "beginner";

  return (
    <div
      id="scorecard-pdf-content"
      style={{
        width: "794px", // Standard A4 Width at 96 DPI
        padding: "50px",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px",
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
        <div style={{ textAlign: "right", fontSize: "11px", color: BRAND.muted }}>
          <p style={{ margin: 0, fontWeight: 800, textTransform: "uppercase" }}>Uplink_Timestamp</p>
          <p style={{ margin: "2px 0 0", fontWeight: 600, color: BRAND.dark }}>
            {format(new Date(assessment.created_at), "dd_MMM_yyyy").toUpperCase()}
          </p>
        </div>
      </div>

      {/* COMPONENT: CANDIDATE_METADATA */}
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
          <div style={{ flex: 1 }}>
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
              {assessment.full_name.toUpperCase()}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
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
              {assessment.profession_categories?.name.replace(" ", "_").toUpperCase() || "CORE_GENERAL"}
            </p>
          </div>
        </div>
      </div>

      {/* HUD: SCORE_METRIC_CENTER */}
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
          {assessment.percentage}%
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
          {READINESS_REGISTRY[readinessKey]}
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
          }}
        >
          <div style={{ opacity: 0.8 }}>
            SYNEPSE_YIELD: <span style={{ color: "#fff" }}>{assessment.total_score}</span>
          </div>
          <div style={{ opacity: 0.8 }}>
            REGISTRY_MAX: <span style={{ color: "#fff" }}>{assessment.max_score}</span>
          </div>
        </div>
      </div>

      {/* VIEWPORT: ANALYSIS_GRID */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "30px" }}>
        {/* Artifact: Strengths */}
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
            {assessment.ai_analysis?.strengths?.slice(0, 4).map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: "8px" }}>
                {s}
              </li>
            )) || <li style={{ color: BRAND.muted }}>Waiting for data sync...</li>}
          </ul>
        </div>

        {/* Artifact: Improvements */}
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
            {(assessment.ai_analysis?.improvement_areas || assessment.improvement_areas)
              ?.slice(0, 4)
              .map((a: string, i: number) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  {a}
                </li>
              )) || <li style={{ color: BRAND.muted }}>Waiting for data sync...</li>}
          </ul>
        </div>
      </div>

      {/* HUD: RECOMMENDATION_ENGINE */}
      {assessment.ai_analysis?.recommendations && (
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
            {assessment.ai_analysis.recommendations.slice(0, 4).map((r: string, i: number) => (
              <div key={i} style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
                <span style={{ color: BRAND.primary, fontWeight: 900 }}>0{i + 1}.</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER: SYSTEM_ARTIFACT_DATA */}
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
        }}
      >
        <div>
          <p style={{ margin: 0 }}>Artifact_ID: {assessment.id.toUpperCase()}</p>
          <p style={{ margin: "4px 0 0", color: BRAND.primary }}>Verification_Status: SYSTEM_VERIFIED</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Generated_By: GroUp_Academy_Neural_Engine</p>
          <p style={{ margin: "4px 0 0" }}>© {new Date().getFullYear()} ALL_RIGHTS_RESERVED</p>
        </div>
      </div>
    </div>
  );
}
