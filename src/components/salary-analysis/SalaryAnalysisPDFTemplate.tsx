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

// Brand colors
const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  dark: "#333333",
  muted: "#6b7280",
  background: "#F4F7F9",
};

const formatSalary = (amount: number) => {
  return new Intl.NumberFormat('en-BD').format(amount);
};

const getPositionLabel = (positioning: string) => {
  switch (positioning) {
    case "above_market": return "Above Market";
    case "below_market": return "Below Market";
    default: return "At Market Rate";
  }
};

const getPositionColor = (positioning: string) => {
  switch (positioning) {
    case "above_market": return BRAND.accent;
    case "below_market": return "#ef4444";
    default: return BRAND.muted;
  }
};

export function SalaryAnalysisPDFTemplate({ analysis }: Props) {
  const ai = analysis.ai_analysis;
  const salaryRange = ai.market_salary_range;
  const skills = ai.skills_analysis;
  const tips = ai.negotiation_tips;
  const insights = ai.market_insights;

  return (
    <div
      id="salary-analysis-pdf-content"
      style={{
        width: "794px",
        padding: "40px",
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: "#ffffff",
        color: BRAND.dark
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: `3px solid ${BRAND.secondary}`, paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0", color: BRAND.secondary, fontFamily: "'Poppins', sans-serif" }}>
          Salary Analysis Report
        </h1>
        <p style={{ fontSize: "14px", color: BRAND.muted, margin: 0 }}>
          GroUp Academy - AI-Powered Career Intelligence
        </p>
      </div>

      {/* Candidate Info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", backgroundColor: BRAND.background, padding: "20px", borderRadius: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0", fontFamily: "'Poppins', sans-serif" }}>
            {analysis.full_name}
          </h2>
          <p style={{ fontSize: "14px", color: BRAND.muted, margin: "0 0 4px 0" }}>
            {analysis.email}
          </p>
          {analysis.job_title && (
            <p style={{ fontSize: "14px", color: BRAND.dark, margin: 0 }}>
              Target: {analysis.job_title}
              {analysis.company_name && ` at ${analysis.company_name}`}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 4px 0" }}>
            Date: {new Date(analysis.completed_at || analysis.created_at).toLocaleDateString()}
          </p>
          {analysis.profession_categories && (
            <p style={{ fontSize: "12px", color: BRAND.muted, margin: 0 }}>
              Field: {analysis.profession_categories.name}
            </p>
          )}
        </div>
      </div>

      {/* Readiness Score */}
      <div style={{ textAlign: "center", marginBottom: "30px", background: `linear-gradient(135deg, ${BRAND.secondary}, ${BRAND.primary})`, color: "white", padding: "30px", borderRadius: "16px" }}>
        <div style={{ fontSize: "72px", fontWeight: "bold", margin: "0 0 8px 0", fontFamily: "'Poppins', sans-serif" }}>
          {ai.overall_readiness_score}%
        </div>
        <div style={{ fontSize: "18px", marginBottom: "8px" }}>Overall Readiness Score</div>
        <div style={{ 
          display: "inline-block", 
          backgroundColor: getPositionColor(ai.salary_positioning), 
          padding: "8px 20px", 
          borderRadius: "24px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          {getPositionLabel(ai.salary_positioning)}
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: "30px", background: `linear-gradient(135deg, ${BRAND.secondary}15, ${BRAND.accent}15)`, padding: "16px", borderRadius: "12px", borderLeft: `4px solid ${BRAND.secondary}` }}>
        <p style={{ fontSize: "14px", lineHeight: "1.7", color: BRAND.dark, margin: 0 }}>
          {ai.summary}
        </p>
      </div>

      {/* Salary Range */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: BRAND.primary, fontFamily: "'Poppins', sans-serif" }}>
          Market Salary Range (Bangladesh)
        </h3>
        <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
          <div style={{ flex: 1, backgroundColor: BRAND.background, padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 4px 0" }}>Minimum</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>৳{formatSalary(salaryRange.min_monthly)}</p>
            <p style={{ fontSize: "11px", color: BRAND.muted, margin: 0 }}>/month</p>
          </div>
          <div style={{ flex: 1, background: `linear-gradient(135deg, ${BRAND.secondary}20, ${BRAND.primary}20)`, padding: "16px", borderRadius: "12px", textAlign: "center", border: `2px solid ${BRAND.secondary}` }}>
            <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 4px 0" }}>Median</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", color: BRAND.primary, margin: 0 }}>৳{formatSalary(salaryRange.median_monthly)}</p>
            <p style={{ fontSize: "11px", color: BRAND.muted, margin: 0 }}>/month</p>
          </div>
          <div style={{ flex: 1, backgroundColor: BRAND.background, padding: "16px", borderRadius: "12px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 4px 0" }}>Maximum</p>
            <p style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>৳{formatSalary(salaryRange.max_monthly)}</p>
            <p style={{ fontSize: "11px", color: BRAND.muted, margin: 0 }}>/month</p>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: BRAND.muted, textAlign: "center", margin: 0 }}>
          Experience Level: {salaryRange.experience_level} • {salaryRange.market_context}
        </p>
      </div>

      {/* Skills Analysis */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: BRAND.primary, fontFamily: "'Poppins', sans-serif" }}>
          Skills Gap Analysis ({skills.skills_gap_score}% match)
        </h3>
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div style={{ flex: 1, backgroundColor: "#ecfdf5", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "bold", color: BRAND.accent, marginBottom: "8px", fontFamily: "'Poppins', sans-serif" }}>
              ✓ Matching Skills
            </h4>
            {skills.matching_skills && skills.matching_skills.length > 0 ? (
              <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.7" }}>
                {skills.matching_skills.join(" • ")}
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: BRAND.muted, margin: 0 }}>None identified</p>
            )}
          </div>
          <div style={{ flex: 1, backgroundColor: "#fff7ed", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "bold", color: "#ea580c", marginBottom: "8px", fontFamily: "'Poppins', sans-serif" }}>
              ↑ Skills to Develop
            </h4>
            {skills.missing_skills && skills.missing_skills.length > 0 ? (
              <p style={{ fontSize: "12px", margin: 0, lineHeight: "1.7" }}>
                {skills.missing_skills.join(" • ")}
              </p>
            ) : (
              <p style={{ fontSize: "12px", color: BRAND.muted, margin: 0 }}>None identified</p>
            )}
          </div>
        </div>
        {skills.recommendations && skills.recommendations.length > 0 && (
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: "bold", marginBottom: "8px", fontFamily: "'Poppins', sans-serif" }}>Skill Recommendations:</h4>
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", lineHeight: "1.7" }}>
              {skills.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} style={{ marginBottom: "4px" }}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Negotiation Tips */}
      {tips && tips.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: BRAND.primary, fontFamily: "'Poppins', sans-serif" }}>
            💡 Negotiation Tips
          </h3>
          {tips.slice(0, 3).map((tip, idx) => (
            <div key={idx} style={{ marginBottom: "12px", backgroundColor: "#fefce8", padding: "12px", borderRadius: "12px" }}>
              <p style={{ fontSize: "13px", fontWeight: "500", margin: "0 0 4px 0" }}>{tip.tip}</p>
              <p style={{ fontSize: "11px", color: BRAND.muted, margin: 0 }}>{tip.rationale}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action Plan */}
      {ai.action_plan && ai.action_plan.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: BRAND.primary, fontFamily: "'Poppins', sans-serif" }}>
            Your Action Plan
          </h3>
          <ol style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.8" }}>
            {ai.action_plan.slice(0, 5).map((action, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>{action}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Market Insights */}
      {insights && (
        <div style={{ marginBottom: "30px", background: `linear-gradient(135deg, ${BRAND.primary}15, ${BRAND.secondary}15)`, padding: "16px", borderRadius: "12px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: "bold", color: BRAND.primary, marginBottom: "8px", fontFamily: "'Poppins', sans-serif" }}>
            Market Insights
          </h4>
          <p style={{ fontSize: "12px", margin: "0 0 8px 0" }}>
            <strong>Demand:</strong> {insights.demand_level} • <strong>Growth:</strong> {insights.growth_trajectory}
          </p>
          {insights.industry_trends && insights.industry_trends.length > 0 && (
            <p style={{ fontSize: "11px", color: BRAND.dark, margin: 0 }}>
              Trends: {insights.industry_trends.slice(0, 2).join(" | ")}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: "20px", borderTop: "2px solid #e5e7eb" }}>
        <p style={{ fontSize: "12px", color: BRAND.muted, margin: "0 0 4px 0" }}>
          Report ID: {analysis.id.slice(0, 8).toUpperCase()}
        </p>
        <p style={{ fontSize: "12px", color: BRAND.muted, margin: 0 }}>
          Generated by GroUp Academy • www.groupacademy.com
        </p>
      </div>
    </div>
  );
}