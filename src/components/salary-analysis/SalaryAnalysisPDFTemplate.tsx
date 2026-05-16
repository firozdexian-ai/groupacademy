import { useMemo } from "react";
import { format } from "date-fns";

interface SalaryRange {
  min_monthly: number;
  median_monthly: number;
  max_monthly: number;
  experience_level: string;
  market_context: string;
}
interface SkillsAnalysis {
  matching_skills: string[];
  missing_skills: string[];
  skills_gap_score: number;
  recommendations: string[];
}
interface NegotiationTip {
  tip: string;
  rationale: string;
}
interface MarketInsights {
  demand_level: string;
  growth_trajectory: string;
  industry_trends: string[];
}
interface AIAnalysis {
  summary: string;
  market_salary_range: SalaryRange;
  skills_analysis: SkillsAnalysis;
  negotiation_tips: NegotiationTip[];
  action_plan: string[];
  market_insights: MarketInsights;
  overall_readiness_score: number;
  salary_positioning: string;
}
interface Analysis {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  company_name: string | null;
  ai_analysis: AIAnalysis;
  created_at: string;
  completed_at: string | null;
  profession_categories?: { name: string } | null;
}

interface Props {
  analysis: Analysis;
}

const BRAND = {
  primary: "#18181b", // Ink Optimized Charcoal
  secondary: "#27272a", // Slate Border
  accent: "#16a34a", // Standard Success Green
  error: "#dc2626", // Deficit Crimson
  dark: "#09090b", // Pure Contrast Black
  muted: "#71717a", // Neutral Zinc Gray
  background: "#fafafa", // Light Background Mesh
};

const formatCurrency = (amt: number) => {
  const numericValue = Number(amt) || 0;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(numericValue);
};

const POSITION_REGISTRY: Record<string, { label: string; color: string; bgColor: string }> = {
  above_market: { label: "ABOVE_MARKET_NODE", color: BRAND.accent, bgColor: "#f0fdf4" },
  below_market: { label: "BELOW_MARKET_DEFICIT", color: BRAND.error, bgColor: "#fef2f2" },
  at_market: { label: "MARKET_EQUILIBRIUM", color: BRAND.muted, bgColor: "#f4f4f5" },
};

/**
 * GroUp Academy: Fiscal Telemetry Salary Parity Analysis Template (SalaryAnalysisPDFTemplate)
 * Authoritative document configuration layout locked to target A4 metric resolutions for high-fidelity PDF serialization.
 * Version: Launch Candidate · Phase Z0 Hardened Print Lock Candidate
 */
export function SalaryAnalysisPDFTemplate({ analysis }: Props) {
  // Safe Ingress Normalization Map: Absorb properties defensively to drop render-breaking hazards
  const secureAnalyticsModel = useMemo(() => {
    const aiNode = analysis?.ai_analysis;
    const salaryNode = aiNode?.market_salary_range;
    const skillsNode = aiNode?.skills_analysis;

    let parsedRegistrySyncDateStr = "PENDING_CALIBRATION";
    try {
      const genericFallbackDateSource = analysis?.completed_at || analysis?.created_at;
      if (genericFallbackDateSource) {
        parsedRegistrySyncDateStr = format(new Date(genericFallbackDateSource), "dd_MMM_yyyy").toUpperCase();
      }
    } catch (dateException) {
      parsedRegistrySyncDateStr = "INVALID_TIMELINE";
    }

    const currentPositionKeyStr = String(aiNode?.salary_positioning || "at_market")
      .trim()
      .toLowerCase();
    const activePositionConfigNode = POSITION_REGISTRY[currentPositionKeyStr] || POSITION_REGISTRY.at_market;

    return {
      syncDateStr: parsedRegistrySyncDateStr,
      fullName: String(analysis?.full_name || "Anonymous Talent Node").trim(),
      jobTitle: String(analysis?.job_title || "GENERAL_CORE_NODE")
        .trim()
        .toUpperCase(),
      companyName: analysis?.company_name ? String(analysis.company_name).trim().toUpperCase() : null,
      sectorCategoryStr: String(analysis?.profession_categories?.name || "CORE_TRAJECTORY")
        .trim()
        .toUpperCase(),
      hashIdStr: String(analysis?.id || "N/A")
        .slice(0, 8)
        .toUpperCase(),
      fullUuidStr: String(analysis?.id || "N/A").toUpperCase(),
      readinessScoreNum: Math.max(0, Math.min(100, Number(aiNode?.overall_readiness_score) || 0)),
      summaryText: String(
        aiNode?.summary || "Fidelity asset overview notes pending structural ingress sync operations.",
      ).trim(),
      salaryMin: Number(salaryNode?.min_monthly) || 0,
      salaryMedian: Number(salaryNode?.median_monthly) || 0,
      salaryMax: Number(salaryNode?.max_monthly) || 0,
      experienceLevelStr: String(salaryNode?.experience_level || "UNCALIBRATED").toUpperCase(),
      marketContextStr: String(salaryNode?.market_context || "GLOBAL_INDEX").toUpperCase(),
      matchingSkillsArray: Array.isArray(skillsNode?.matching_skills) ? skillsNode.matching_skills : [],
      missingSkillsArray: Array.isArray(skillsNode?.missing_skills) ? skillsNode.missing_skills : [],
      negotiationTipsArray: Array.isArray(aiNode?.negotiation_tips) ? aiNode.negotiation_tips.slice(0, 3) : [],
      strategicActionPlanArray: Array.isArray(aiNode?.action_plan) ? aiNode.action_plan.slice(0, 5) : [],
      positionConfig: activePositionConfigNode,
    };
  }, [analysis]);

  return (
    <div
      id="salary-analysis-pdf-content"
      style={{
        width: "794px",
        minHeight: "1123px",
        padding: "45px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
        color: BRAND.dark,
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* HUD LEVEL 1: DOCUMENT METRIC TRACK HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "35px",
          paddingBottom: "20px",
          borderBottom: `2px solid ${BRAND.primary}`,
          pageBreakInside: "avoid",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "26px",
              className: "tracking-tight",
              fontWeight: 900,
              color: BRAND.dark,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
            }}
          >
            Fiscal Telemetry Salary Report
          </h1>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "9px",
              fontWeight: 700,
              color: BRAND.muted,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            GroUp Academy &bull; Neural Intelligence Analysis v4.0
          </p>
        </div>

        <div
          style={{
            textAlign: "right",
            fontSize: "9px",
            fontFamily: "monospace",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Registry Sync Log: {secureAnalyticsModel.syncDateStr}
        </div>
      </div>

      {/* HUD LEVEL 2: COMPOSITE METADATA IDENTIFICATION CARDS STRIP */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "30px",
          pageBreakInside: "avoid",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: BRAND.background,
            padding: "20px 24px",
            borderRadius: "12px",
            border: "1px solid #e4e4e7",
            textAlign: "left",
          }}
        >
          <span
            style={{
              margin: 0,
              fontSize: "8.5px",
              fontMono: true,
              fontWeight: 800,
              color: BRAND.muted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Identity Mapping Record
          </span>
          <h2
            style={{ fontSize: "20px", fontWeight: 800, color: BRAND.dark, margin: "2px 0 10px 0", tracking: "tight" }}
          >
            {secureAnalyticsModel.fullName}
          </h2>

          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ minWidth: 0 }}>
              <span
                style={{ margin: 0, fontSize: "8px", fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}
              >
                Target Placement Role
              </span>
              <p
                style={{
                  fontSize: "12px",
                  fontStyle: "italic",
                  fontWeight: 700,
                  margin: "2px 0 0 0",
                  color: BRAND.dark,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {secureAnalyticsModel.jobTitle}
              </p>
            </div>
            {secureAnalyticsModel.companyName && (
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    margin: 0,
                    fontSize: "8px",
                    fontWeight: 800,
                    color: BRAND.muted,
                    textTransform: "uppercase",
                  }}
                >
                  Host Institution
                </span>
                <p
                  style={{
                    fontSize: "12px",
                    fontStyle: "italic",
                    fontWeight: 700,
                    margin: "2px 0 0 0",
                    color: BRAND.dark,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {secureAnalyticsModel.companyName}
                </p>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            width: "200px",
            textAlign: "center",
            backgroundColor: BRAND.dark,
            color: "#ffffff",
            padding: "20px 16px",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            boxSizing: "border-box",
            shrink: 0,
          }}
        >
          <span
            style={{
              margin: 0,
              fontSize: "8px",
              fontWeight: 800,
              color: BRAND.muted,
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Operational Vector Field
          </span>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 800,
              margin: "4px 0",
              color: "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {secureAnalyticsModel.sectorCategoryStr}
          </p>
          <span
            style={{
              margin: "6px 0 0 0",
              fontSize: "8px",
              fontFamily: "monospace",
              opacity: 0.5,
              textTransform: "uppercase",
            }}
          >
            Index Block: {secureAnalyticsModel.hashIdStr}
          </span>
        </div>
      </div>

      {/* HUD LEVEL 3: READINESS TARGET GAIN SUMMARY BOX */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "35px",
          backgroundColor: BRAND.dark,
          color: "#ffffff",
          padding: "30px",
          borderRadius: "16px",
          boxSizing: "border-box",
          pageBreakInside: "avoid",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "2.5px",
            opacity: 0.7,
            fontMono: true,
          }}
        >
          Overall Trajectory Readiness Index Coefficient
        </span>

        <div
          style={{
            fontSize: "76px",
            fontWeight: 900,
            margin: "4px 0 8px 0",
            fontStyle: "italic",
            letterSpacing: "-3px",
            lineHeight: 1,
            color: "#ffffff",
          }}
        >
          {secureAnalyticsModel.readinessScoreNum}%
        </div>

        <div
          style={{
            display: "inline-block",
            backgroundColor: secureAnalyticsModel.positionConfig.bgColor,
            color: secureAnalyticsModel.positionConfig.color,
            border: `1px solid ${secureAnalyticsModel.positionConfig.color}30`,
            padding: "6px 20px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {secureAnalyticsModel.positionConfig.label.replace(/_/g, " ")}
        </div>
      </div>

      {/* HUD LEVEL 4: CORE PROFILE NARRATIVE ABSTRACT CONTAINER */}
      <div
        style={{
          marginBottom: "35px",
          backgroundColor: BRAND.background,
          padding: "20px 24px",
          borderRadius: "12px",
          borderLeft: `4px solid ${BRAND.dark}`,
          pageBreakInside: "avoid",
        }}
      >
        <p
          style={{
            fontSize: "12.5px",
            lineHeight: "1.65",
            color: BRAND.dark,
            margin: 0,
            fontStyle: "italic",
            textAlign: "left",
          }}
        >
          {secureAnalyticsModel.summaryText}
        </p>
      </div>

      {/* HUD LEVEL 5: FISCAL VALUE DISTRIBUTION TRIPLE MATRICES */}
      <div style={{ marginBottom: "35px", pageBreakInside: "avoid" }}>
        <h3
          style={{
            fontSize: "12px",
            fontWeight: 800,
            marginBottom: "14px",
            color: BRAND.dark,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            textAlign: "left",
          }}
        >
          Market Salary Equilibrium Nodes
        </h3>

        <div style={{ display: "flex", gap: "14px" }}>
          {[
            { label: "Minimum Vector Bounds", val: secureAnalyticsModel.salaryMin, accent: false },
            { label: "Median Scale Alignment", val: secureAnalyticsModel.salaryMedian, accent: true },
            { label: "Maximum Ceiling Cap", val: secureAnalyticsModel.salaryMax, accent: false },
          ].map((nodeBlock, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: nodeBlock.accent ? "#ffffff" : BRAND.background,
                padding: "20px 12px",
                borderRadius: "12px",
                textAlign: "center",
                border: nodeBlock.accent ? `2px solid ${BRAND.dark}` : "1px solid #e4e4e7",
                boxSizing: "border-box",
              }}
            >
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  color: BRAND.muted,
                  margin: "0 0 6px 0",
                  textTransform: "uppercase",
                  block: true,
                  leading: "none",
                }}
              >
                {nodeBlock.label}
              </span>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 900,
                  color: BRAND.dark,
                  margin: 0,
                  fontMono: true,
                  tabularNums: true,
                }}
              >
                ${formatCurrency(nodeBlock.val)}
              </p>
              <span
                style={{
                  fontSize: "8.5px",
                  fontMono: true,
                  fontWeight: 700,
                  color: BRAND.muted,
                  margin: "4px 0 0 0",
                  block: true,
                  leading: "none",
                }}
              >
                USD / MONTHLY PAY
              </span>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: "9px",
            fontMono: true,
            fontWeight: 800,
            color: BRAND.muted,
            textAlign: "center",
            marginTop: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Baseline Target Parameters: {secureAnalyticsModel.experienceLevelStr} &bull;{" "}
          {secureAnalyticsModel.marketContextStr} Mapped Context Index
        </p>
      </div>

      {/* HUD LEVEL 6: FLEX DUAL COLUMN COMPETENCY CAPABILITIES SHEETS */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "35px",
          pageBreakInside: "avoid",
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: "#f0fdf4",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #bbf7d0",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: BRAND.accent,
              marginBottom: "10px",
              textTransform: "uppercase",
              block: true,
              fontMono: true,
            }}
          >
            [+] Verified Matching Core Skills
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", pt: "2px" }}>
            {secureAnalyticsModel.matchingSkillsArray.length === 0 ? (
              <span style={{ fontSize: "11px", color: BRAND.muted, fontStyle: "italic" }}>
                No clean matching markers computed.
              </span>
            ) : (
              secureAnalyticsModel.matchingSkillsArray.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #dcfce7",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    fontMono: true,
                    color: BRAND.dark,
                  }}
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            backgroundColor: "#fef2f2",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            textAlign: "left",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              color: BRAND.error,
              marginBottom: "10px",
              textTransform: "uppercase",
              block: true,
              fontMono: true,
            }}
          >
            [△] Targeted Infrastructure Optimization Gaps
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", pt: "2px" }}>
            {secureAnalyticsModel.missingSkillsArray.length === 0 ? (
              <span style={{ fontSize: "11px", color: BRAND.accent, fontStyle: "italic" }}>
                Matrix equilibrium reached. Gaps zeroed out.
              </span>
            ) : (
              secureAnalyticsModel.missingSkillsArray.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 8px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #fee2e2",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                    fontMono: true,
                    color: BRAND.dark,
                  }}
                >
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HUD LEVEL 7: TWIN BLOCK STRATEGY ACTIONS EXECUTION TRACK */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "35px",
          pageBreakInside: "avoid",
        }}
      >
        <div style={{ flex: 1, textAlign: "left" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "12px",
              color: BRAND.dark,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Negotiation Protocol Manual
          </h3>
          {secureAnalyticsModel.negotiationTipsArray.length === 0 ? (
            <p style={{ fontSize: "11px", color: BRAND.muted, fontStyle: "italic" }}>Strategy guidelines unmapped.</p>
          ) : (
            secureAnalyticsModel.negotiationTipsArray.map((tipNode, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "10px",
                  backgroundColor: "#fffdf5",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #fef08a",
                  boxSizing: "border-box",
                }}
              >
                <p style={{ fontSize: "12px", fontWeight: 800, margin: "0 0 4px 0", color: BRAND.dark }}>
                  {tipNode.tip}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 500,
                    color: BRAND.muted,
                    margin: 0,
                    lineHeight: 1.4,
                    fontStyle: "italic",
                  }}
                >
                  {tipNode.rationale}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, textAlign: "left" }}>
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "12px",
              color: BRAND.dark,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Strategic Action Optimization Plan
          </h3>
          <div style={{ paddingLeft: "2px" }}>
            {secureAnalyticsModel.strategicActionPlanArray.length === 0 ? (
              <p style={{ fontSize: "11px", color: BRAND.muted, fontStyle: "italic" }}>Action guidelines unmapped.</p>
            ) : (
              secureAnalyticsModel.strategicActionPlanArray.map((actionStr, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "10px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    alignItems: "flex-start",
                    lineHeight: 1.35,
                  }}
                >
                  <span style={{ color: BRAND.dark, fontFamily: "monospace", fontWeight: 900, shrink: 0 }}>
                    0{i + 1}.
                  </span>
                  <span style={{ color: BRAND.dark }}>{actionStr}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HUD LEVEL 8: SYSTEM REGISTRY CORE ARCHIVE FOOTER BLOCK */}
      <div
        style={{
          borderTop: "1px solid #e4e4e7",
          paddingTop: "20px",
          textAlign: "center",
          pageBreakInside: "avoid",
          marginTop: "auto",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            fontFamily: "monospace",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Authority Sync Vault Checksum Index Ref Token Line: {secureAnalyticsModel.fullUuidStr}
        </span>
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: "9px",
            fontWeight: 700,
            color: BRAND.muted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          &copy; 2026 GroUp Academy &bull; Neural Fiscal Analytics and Parity Audit Division
        </p>
      </div>
    </div>
  );
}
