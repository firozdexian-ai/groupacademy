import { format } from "date-fns";

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

interface ScorecardPDFTemplateProps {
  assessment: Assessment;
}

const readinessLabels: Record<string, string> = {
  beginner: "Beginner",
  developing: "Developing",
  competent: "Competent",
  proficient: "Proficient",
  expert: "Expert",
};

// Brand colors - Tech Blue #2A7DDE, Vibrant Cyan #33E1E4, Success Green #10D576
const BRAND = {
  primary: "#2A7DDE",
  primaryLight: "#4A9AEF",
  secondary: "#33E1E4",
  accent: "#10D576",
  dark: "#333333",
  muted: "#6b7280",
  background: "#F4F7F9",
};

export function ScorecardPDFTemplate({ assessment }: ScorecardPDFTemplateProps) {
  const readinessLevel = assessment.readiness_level || "beginner";

  return (
    <div
      id="scorecard-pdf-content"
      style={{
        width: "794px",
        padding: "40px",
        backgroundColor: "#ffffff",
        // Use system fonts for reliable PDF rendering
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px",
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: `3px solid ${BRAND.primary}`
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: "28px", 
            fontWeight: 700, 
            color: BRAND.primary,
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            GroUp Academy
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: BRAND.muted }}>
            Career Readiness Scorecard
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "12px", color: BRAND.muted }}>
          <p style={{ margin: 0 }}>Assessment Date</p>
          <p style={{ margin: "2px 0 0", fontWeight: 600, color: BRAND.dark }}>
            {format(new Date(assessment.created_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Candidate Info */}
      <div style={{ 
        backgroundColor: BRAND.background, 
        padding: "16px 20px", 
        borderRadius: "12px",
        marginBottom: "24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: BRAND.muted }}>Candidate Name</p>
            <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>
              {assessment.full_name}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "12px", color: BRAND.muted }}>Profession Category</p>
            <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 500 }}>
              {assessment.profession_categories?.name || "General"}
            </p>
          </div>
        </div>
      </div>

      {/* Score Section - Gradient from Primary to Secondary */}
      <div style={{ 
        textAlign: "center", 
        padding: "30px",
        background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
        borderRadius: "16px",
        marginBottom: "24px",
        color: "#ffffff"
      }}>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Career Readiness Score</p>
        <p style={{ 
          margin: "8px 0", 
          fontSize: "72px", 
          fontWeight: 700, 
          lineHeight: 1,
          fontFamily: "system-ui, sans-serif"
        }}>
          {assessment.percentage}%
        </p>
        <div style={{ 
          display: "inline-block",
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: "8px 20px",
          borderRadius: "24px",
          fontSize: "14px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {readinessLabels[readinessLevel]}
        </div>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "40px", 
          marginTop: "20px",
          fontSize: "13px"
        }}>
          <div>
            <span style={{ opacity: 0.8 }}>Points Earned: </span>
            <strong>{assessment.total_score}</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8 }}>Max Points: </span>
            <strong>{assessment.max_score}</strong>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
        {/* Strengths */}
        <div style={{ flex: 1, backgroundColor: "#ecfdf5", padding: "16px", borderRadius: "12px" }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: BRAND.accent,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "system-ui, sans-serif"
          }}>
            ✓ Strengths
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: "16px", 
            fontSize: "12px",
            lineHeight: 1.7,
            color: BRAND.dark
          }}>
            {assessment.ai_analysis?.strengths?.slice(0, 4).map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: "6px" }}>{s}</li>
            )) || <li style={{ color: BRAND.muted }}>Analysis pending...</li>}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div style={{ flex: 1, backgroundColor: "#fff7ed", padding: "16px", borderRadius: "12px" }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: "#ea580c",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontFamily: "system-ui, sans-serif"
          }}>
            △ Areas for Improvement
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: "16px", 
            fontSize: "12px",
            lineHeight: 1.7,
            color: BRAND.dark
          }}>
            {(assessment.ai_analysis?.improvement_areas || assessment.improvement_areas)?.slice(0, 4).map((a: string, i: number) => (
              <li key={i} style={{ marginBottom: "6px" }}>{a}</li>
            )) || <li style={{ color: BRAND.muted }}>Analysis pending...</li>}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {assessment.ai_analysis?.recommendations && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: BRAND.primary,
            fontFamily: "system-ui, sans-serif"
          }}>
            Personalized Recommendations
          </h3>
          <ol style={{ 
            margin: 0, 
            paddingLeft: "20px", 
            fontSize: "12px",
            lineHeight: 1.7,
            color: BRAND.dark
          }}>
            {assessment.ai_analysis.recommendations.slice(0, 5).map((r: string, i: number) => (
              <li key={i} style={{ marginBottom: "8px" }}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Career Tip */}
      {assessment.ai_analysis?.career_tips && (
        <div style={{ 
          backgroundColor: "#fef3c7",
          padding: "16px",
          borderRadius: "12px",
          borderLeft: `4px solid ${BRAND.secondary}`,
          marginBottom: "24px"
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: "12px", 
            fontStyle: "italic",
            color: "#92400e"
          }}>
            💡 {assessment.ai_analysis.career_tips}
          </p>
        </div>
      )}

      {/* CTA */}
      <div style={{ 
        textAlign: "center",
        padding: "20px",
        background: `linear-gradient(135deg, ${BRAND.secondary}20, ${BRAND.accent}20)`,
        borderRadius: "12px",
        marginBottom: "24px"
      }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: BRAND.primary, fontFamily: "'Poppins', sans-serif" }}>
          Ready to accelerate your career?
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: BRAND.muted }}>
          Visit groupacademy.com to explore Mock Interviews, Salary Analysis, and more
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        borderTop: "1px solid #e5e7eb",
        paddingTop: "16px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        color: BRAND.muted
      }}>
        <div>
          <p style={{ margin: 0 }}>Assessment ID: {assessment.id.slice(0, 8).toUpperCase()}</p>
          <p style={{ margin: "2px 0 0" }}>Valid for 90 days</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Generated by GroUp Academy</p>
          <p style={{ margin: "2px 0 0" }}>© {new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}