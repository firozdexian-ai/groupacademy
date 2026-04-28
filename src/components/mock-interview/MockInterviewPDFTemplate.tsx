import { format } from "date-fns";

/**
 * GroUp Academy: Mock Interview PDF Template
 * CTO Reference: Authoritative report template for high-fidelity performance artifacts.
 */

// Interface definitions remain consistent with the registry standard
interface Question {
  id: string;
  question: string;
  category: string;
  expected_points: string[];
}
interface Answer {
  question_id: string;
  answer: string;
  time_taken_seconds: number;
}
interface QuestionFeedback {
  question_id: string;
  score: number;
  feedback: string;
  missed_points: string[];
  improvement_tips: string;
}
interface AIFeedback {
  overall_feedback: string;
  question_feedback: QuestionFeedback[];
  interview_tips: string;
}
interface Interview {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  company_name: string | null;
  questions: Question[];
  answers: Answer[];
  ai_feedback: AIFeedback | null;
  selection_percentage: number | null;
  performance_level: string | null;
  strengths: string[] | null;
  improvement_areas: string[] | null;
  difficulty: string;
  question_count: number;
  created_at: string;
  completed_at: string | null;
}

interface Props {
  interview: Interview;
}

const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  warning: "#EA580C",
  dark: "#0F172A",
  muted: "#64748B",
  background: "#F8FAFC",
};

const PERFORMANCE_REGISTRY: Record<string, string> = {
  needs_work: "CRITICAL_DEFICIT",
  developing: "DEVELOPING_SYNC",
  competent: "COMPETENT_CORE",
  strong: "PROFICIENT_OPS",
  excellent: "EXECUTIVE_EXPERT",
};

export function MockInterviewPDFTemplate({ interview }: Props) {
  const selectionPercentage = interview.selection_percentage || 0;
  const performanceKey = interview.performance_level || "needs_work";

  return (
    <div
      id="mock-interview-pdf-content"
      style={{
        width: "794px", // Standard A4 Resolution Node
        padding: "50px",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
        color: BRAND.dark,
        boxSizing: "border-box",
      }}
    >
      {/* HUD: REPORT_HEADER */}
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
              textTransform: "uppercase",
              fontStyle: "italic",
              letterSpacing: "-1px",
            }}
          >
            Mock_Interview_Report
          </h1>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: "12px",
              fontWeight: 700,
              color: BRAND.muted,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            GroUp_Academy Neural_Assessment_v4
          </p>
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: "10px",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Registry_Sync: {format(new Date(interview.completed_at || interview.created_at), "dd_MMM_yyyy").toUpperCase()}
        </div>
      </div>

      {/* COMPONENT: CANDIDATE_TRAJECTORY_HUD */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: BRAND.background,
            padding: "25px",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}>
            Identity_Artifact
          </p>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 12px 0" }}>{interview.full_name}</h2>
          <div style={{ display: "flex", gap: "15px" }}>
            <div>
              <p
                style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}
              >
                Target_Role
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{interview.job_title || "GENERAL_NODE"}</p>
            </div>
            {interview.company_name && (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9px",
                    fontWeight: 800,
                    color: BRAND.muted,
                    textTransform: "uppercase",
                  }}
                >
                  Institution
                </p>
                <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{interview.company_name}</p>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            width: "200px",
            textAlign: "center",
            backgroundColor: BRAND.dark,
            color: "#fff",
            padding: "20px",
            borderRadius: "24px",
          }}
        >
          <p
            style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: BRAND.secondary, textTransform: "uppercase" }}
          >
            Difficulty_Index
          </p>
          <p style={{ fontSize: "18px", fontWeight: 800, margin: "5px 0" }}>{interview.difficulty.toUpperCase()}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: "9px", opacity: 0.6 }}>
            {interview.question_count} CORE_QUESTIONS
          </p>
        </div>
      </div>

      {/* HUD: SCORE_MATRIX */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
          color: "white",
          padding: "40px",
          borderRadius: "32px",
          boxShadow: "0 20px 40px rgba(42, 125, 222, 0.2)",
        }}
      >
        <div
          style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", opacity: 0.9 }}
        >
          Neural_Selection_Parity
        </div>
        <div
          style={{
            fontSize: "92px",
            fontWeight: 900,
            margin: "10px 0",
            fontStyle: "italic",
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          {selectionPercentage}%
        </div>
        <div
          style={{
            display: "inline-block",
            backgroundColor: "rgba(255,255,255,0.15)",
            padding: "10px 30px",
            borderRadius: "15px",
            fontSize: "14px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1px",
            border: "1px solid rgba(255,255,255,0.3)",
          }}
        >
          {PERFORMANCE_REGISTRY[performanceKey]}
        </div>
      </div>

      {/* COMPONENT: DIAGNOSTIC_GRID */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "40px" }}>
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
              fontSize: "12px",
              fontWeight: 800,
              color: BRAND.accent,
              marginBottom: "15px",
              textTransform: "uppercase",
            }}
          >
            [+] Sync_Strengths
          </h3>
          <ul style={{ margin: 0, paddingLeft: "15px", fontSize: "12px", lineHeight: "1.8", fontWeight: 500 }}>
            {interview.strengths?.map((s, i) => (
              <li key={i} style={{ marginBottom: "6px" }}>
                {s}
              </li>
            )) || <li>No data.</li>}
          </ul>
        </div>
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
              fontSize: "12px",
              fontWeight: 800,
              color: BRAND.warning,
              marginBottom: "15px",
              textTransform: "uppercase",
            }}
          >
            [△] Optimization_Nodes
          </h3>
          <ul style={{ margin: 0, paddingLeft: "15px", fontSize: "12px", lineHeight: "1.8", fontWeight: 500 }}>
            {interview.improvement_areas?.map((a, i) => (
              <li key={i} style={{ marginBottom: "6px" }}>
                {a}
              </li>
            )) || <li>No data.</li>}
          </ul>
        </div>
      </div>

      {/* VIEWPORT: FEEDBACK_LEDGER */}
      <div style={{ marginBottom: "40px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 800,
            marginBottom: "20px",
            color: BRAND.primary,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Neural_Feedback_Ledger
        </h3>
        {interview.ai_feedback?.question_feedback?.map((feedback, idx) => (
          <div
            key={feedback.question_id}
            style={{ marginBottom: "25px", borderBottom: "1px solid #f1f5f9", paddingBottom: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
              }}
            >
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 900,
                    backgroundColor: BRAND.background,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    marginRight: "12px",
                  }}
                >
                  NODE_0{idx + 1}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: BRAND.dark }}>
                  {interview.questions.find((q) => q.id === feedback.question_id)?.question}
                </span>
              </div>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  backgroundColor: feedback.score >= 7 ? BRAND.accent : feedback.score >= 5 ? "#F59E0B" : "#F43F5E",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "16px",
                  marginLeft: "20px",
                }}
              >
                {feedback.score}
              </div>
            </div>
            <p
              style={{
                fontSize: "12px",
                color: BRAND.muted,
                marginBottom: "10px",
                paddingLeft: "15px",
                borderLeft: `3px solid #e2e8f0`,
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              {feedback.feedback}
            </p>
            {feedback.improvement_tips && (
              <div style={{ fontSize: "11px", color: BRAND.primary, fontWeight: 600, display: "flex", gap: "8px" }}>
                <span>STRATEGY:</span>
                <span style={{ color: BRAND.dark }}>{feedback.improvement_tips}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FOOTER: SYSTEM_ARTIFACT_DATA */}
      <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "25px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "10px",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Artifact_ID: {interview.id.toUpperCase()} • Generated_by_Neural_Engine_v4.2
        </p>
      </div>
    </div>
  );
}
