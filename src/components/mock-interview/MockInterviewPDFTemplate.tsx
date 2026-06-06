import { useEffect, useMemo } from "react";
import { format } from "date-fns";
import { trackError, trackEvent } from "@/lib/errorTracking";

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
  needs_work: "Needs Work",
  developing: "Developing",
  competent: "Competent",
  strong: "Strong",
  excellent: "Excellent",
};

/**
 * GroUp Academy: Automated Career Trajectory Assessment Artifact (MockInterviewPDFTemplate)
 * An authoritative static print layer compiling performance metrics into high-fidelity immutable PDF structures.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function MockInterviewPDFTemplate({ interview }: Props) {
  // Monitor generation pipeline parameters safely via telemetry hooks
  useEffect(() => {
    if (interview?.id) {
      trackEvent("mock_interview_pdf_artifact_compiled", {
        interviewId: interview.id,
        difficultyIndex: interview.difficulty,
        questionCount: interview.question_count,
      });
    }
  }, [interview?.id, interview?.difficulty, interview?.question_count]);

  // Defensive O(1) Pre-indexing: Prevent runtime string mapping failures inside loop layers
  const questionDictionaryMap = useMemo(() => {
    const temporaryBufferMap = new Map<string, string>();
    if (Array.isArray(interview?.questions)) {
      interview.questions.forEach((questionNode) => {
        if (questionNode?.id) {
          temporaryBufferMap.set(questionNode.id, questionNode.question.trim());
        }
      });
    }
    return temporaryBufferMap;
  }, [interview?.questions]);

  // Defensive Date Ingress Resolution Pass
  const formattedRegistrySyncDate = useMemo(() => {
    const rawTemporalTarget = interview?.completed_at || interview?.created_at || new Date().toISOString();
    try {
      const parsedValidationTimestamp = new Date(rawTemporalTarget);
      if (isNaN(parsedValidationTimestamp.getTime())) {
        throw new Error("CHRONO_PARSE_FAILURE");
      }
      return format(parsedValidationTimestamp, "dd_MMM_yyyy").toUpperCase();
    } catch (chronoErr) {
      trackError(chronoErr, {
        component: "MockInterviewPDFTemplate",
        action: "parse_registry_sync_date",
        rawInput: rawTemporalTarget,
      });
      return format(new Date(), "dd_MMM_yyyy").toUpperCase();
    }
  }, [interview?.completed_at, interview?.created_at]);

  if (!interview || !interview.id) {
    trackError("MockInterviewPDFTemplate mounted without authoritative structural models.", {
      component: "MockInterviewPDFTemplate",
      action: "null_pointer_assertion",
    });
    return null;
  }

  const selectionPercentage = Math.max(0, Math.min(100, Math.round(interview.selection_percentage || 0)));
  const performanceKey =
    interview.performance_level && PERFORMANCE_REGISTRY[interview.performance_level]
      ? interview.performance_level
      : "needs_work";

  const questionFeedbackCollection = interview.ai_feedback?.question_feedback || [];

  return (
    <div
      style={{
        width: "794px", // Fixed 794px A4 Width
        minHeight: "1123px", // Target A4 Height Bounds
        padding: "60px 50px", // Defensive Print Margin Alignment Padding
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
        color: BRAND.dark,
        boxSizing: "border-box",
        textAlign: "left",
        direction: "ltr",
      }}
    >
      <div id="mock-interview-pdf-content" style={{ width: "100%", height: "100%" }}>
        {/* HUD LEVEL 1: IMMUTABLE REPORT HEADER CONTEXT SUMMARY */}
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
          <div style={{ textAlign: "left" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                fontWeight: 900,
                color: BRAND.primary,
                textTransform: "uppercase",
                fontStyle: "italic",
                letterSpacing: "-1px",
                lineHeight: 1.1,
              }}
            >
              Mock Interview Report
            </h1>
            <p
              style={{
                margin: "6px 0 0 0",
                fontSize: "11px",
                fontWeight: 700,
                color: BRAND.muted,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                lineHeight: 1,
              }}
            >
              GroUp Academy Assessment
            </p>
          </div>
          <div
            style={{
              textAlign: "right",
              fontSize: "10px",
              color: BRAND.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              lineHeight: 1,
              fontFamily: "monospace",
            }}
          >
            Completed: {formattedRegistrySyncDate}
          </div>
        </div>

        {/* HUD LEVEL 2: CANDIDATE SCHEDULING IDENTIFICATION SHIELD */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "35px", width: "100%" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: BRAND.background,
              padding: "25px",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              textAlign: "left",
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 800,
                color: BRAND.muted,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Candidate
            </p>
            <h2
              style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 14px 0", color: BRAND.dark, lineHeight: 1.2 }}
            >
              {interview.full_name || "Anonymous"}
            </h2>
            <div style={{ display: "flex", gap: "24px" }}>
              <div style={{ textAlign: "left" }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9px",
                    fontWeight: 800,
                    color: BRAND.muted,
                    textTransform: "uppercase",
                  }}
                >
                  Target Role
                </p>
                <p style={{ fontSize: "13px", fontWeight: 700, margin: "2px 0 0 0", color: BRAND.dark }}>
                  {interview.job_title ? interview.job_title.trim() : "General"}
                </p>
              </div>
              {interview.company_name && (
                <div style={{ textAlign: "left" }}>
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
                  <p style={{ fontSize: "13px", fontWeight: 700, margin: "2px 0 0 0", color: BRAND.dark }}>
                    {interview.company_name.trim()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              width: "220px",
              textAlign: "center",
              backgroundColor: BRAND.dark,
              color: "#ffffff",
              padding: "22px 20px",
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "9px",
                fontWeight: 800,
                color: BRAND.secondary,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Difficulty
            </p>
            <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "6px 0", color: "#ffffff", lineHeight: 1 }}>
              {interview.difficulty ? interview.difficulty.toUpperCase() : "STANDARD"}
            </h3>
            <p style={{ margin: "6px 0 0 0", fontSize: "9px", opacity: 0.7, fontWeight: 700, fontFamily: "monospace" }}>
              {Number(interview.question_count || 0)} Core Questions
            </p>
          </div>
        </div>

        {/* HUD LEVEL 3: NEURAL SCORE PARITY GRADIENT COVER CARD */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
            background: `linear-gradient(135deg, ${BRAND.primary}, #1D4ED8)`,
            color: "#ffffff",
            padding: "35px 20px",
            borderRadius: "24px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "2.5px",
              opacity: 0.95,
            }}
          >
            Estimated Pass Probability
          </div>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 900,
              margin: "8px 0",
              fontStyle: "italic",
              letterSpacing: "-3px",
              lineHeight: 1,
            }}
          >
            {selectionPercentage}%
          </div>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              padding: "8px 24px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "1px",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            {PERFORMANCE_REGISTRY[performanceKey]}
          </div>
        </div>

        {/* HUD LEVEL 4: TWO-COLUMN DIAGNOSTIC STRENGTHS/ANOMALIES GRID */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "40px", width: "100%" }}>
          <div
            style={{
              flex: 1,
              backgroundColor: "#F0FDF4",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid rgba(16, 213, 118, 0.15)",
              boxSizing: "border-box",
              textAlign: "left",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: BRAND.accent,
                margin: "0 0 12px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              [+] Key Strengths
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "12px",
                lineHeight: "1.7",
                fontWeight: 500,
                color: BRAND.dark,
              }}
            >
              {interview.strengths && interview.strengths.filter(Boolean).length > 0 ? (
                interview.strengths.map((strengthItem, idx) => (
                  <li key={idx} style={{ marginBottom: "6px", wordBreak: "break-word" }}>
                    {strengthItem}
                  </li>
                ))
              ) : (
                <li style={{ listStyleType: "none", marginLeft: "-16px", fontStyle: "italic", color: BRAND.muted }}>
                  No baseline assets logged.
                </li>
              )}
            </ul>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: "#FFF7ED",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid rgba(234, 88, 12, 0.15)",
              boxSizing: "border-box",
              textAlign: "left",
            }}
          >
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 800,
                color: BRAND.warning,
                margin: "0 0 12px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              [△] Areas for Improvement
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "12px",
                lineHeight: "1.7",
                fontWeight: 500,
                color: BRAND.dark,
              }}
            >
              {interview.improvement_areas && interview.improvement_areas.filter(Boolean).length > 0 ? (
                interview.improvement_areas.map((improvementItem, idx) => (
                  <li key={idx} style={{ marginBottom: "6px", wordBreak: "break-word" }}>
                    {improvementItem}
                  </li>
                ))
              ) : (
                <li style={{ listStyleType: "none", marginLeft: "-16px", fontStyle: "italic", color: BRAND.muted }}>
                  No parameter anomalies logged.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* HUD LEVEL 5: COMPREHENSIVE QUESTION FEEDBACK LEDGER STACK */}
        <div style={{ marginBottom: "35px", textAlign: "left" }}>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 800,
              marginBottom: "20px",
              color: BRAND.primary,
              textTransform: "uppercase",
              letterSpacing: "1px",
              borderBottom: "1px solid #f1f5f9",
              paddingBottom: "8px",
            }}
          >
            Detailed Feedback
          </h3>

          {questionFeedbackCollection.length === 0 ? (
            <p
              style={{
                fontSize: "12px",
                fontStyle: "italic",
                color: BRAND.muted,
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              No modular feedback arrays compiled for this evaluation token.
            </p>
          ) : (
            questionFeedbackCollection.map((feedbackItem, idx) => {
              if (!feedbackItem) return null;

              // High-Performance Map Ingress Check: Fast O(1) text matching pass
              const extractedQuestionStemStr =
                questionDictionaryMap.get(feedbackItem.question_id) ||
                "Evaluation query mapping sequence missing error.";

              const resolvedScoreInt = typeof feedbackItem.score === "number" ? feedbackItem.score : 0;
              const numericBadgeColorStr =
                resolvedScoreInt >= 7 ? BRAND.accent : resolvedScoreInt >= 5 ? "#F59E0B" : "#F43F5E";

              return (
                <div
                  key={feedbackItem.question_id || idx}
                  style={{
                    marginBottom: "25px",
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: "20px",
                    pageBreakInside: "avoid", // Prevent visual row truncation over multi-page print threads
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                      width: "100%",
                    }}
                  >
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 900,
                          backgroundColor: BRAND.background,
                          color: BRAND.dark,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          marginRight: "10px",
                          fontFamily: "monospace",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Question {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 700,
                          color: BRAND.dark,
                          lineHeight: "1.4",
                          userSelect: "all",
                        }}
                      >
                        {extractedQuestionStemStr}
                      </span>
                    </div>

                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        backgroundColor: numericBadgeColorStr,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "15px",
                        marginLeft: "20px",
                        flexShrink: 0,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        fontFamily: "monospace",
                      }}
                    >
                      {resolvedScoreInt}
                    </div>
                  </div>

                  <p
                    style={{
                      fontSize: "12px",
                      color: BRAND.muted,
                      margin: "0 0 12px 0",
                      paddingLeft: "15px",
                      borderLeft: `3px solid #e2e8f0`,
                      fontStyle: "italic",
                      lineHeight: "1.6",
                    }}
                  >
                    {feedbackItem.feedback ? feedbackItem.feedback.trim() : "No performance commentary compiled."}
                  </p>

                  {feedbackItem.improvement_tips && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: BRAND.primary,
                        fontWeight: 600,
                        display: "flex",
                        gap: "8px",
                        lineHeight: "1.4",
                      }}
                    >
                      <span style={{ letterSpacing: "0.5px", flexShrink: 0 }}>Tip:</span>
                      <span style={{ color: BRAND.dark, fontWeight: 500 }}>{feedbackItem.improvement_tips.trim()}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* HUD LEVEL 6: SYSTEM ARCHIVE AUDIT FOOTER BRAND STRIP */}
        <div
          style={{
            borderTop: "2px solid #f1f5f9",
            paddingTop: "25px",
            textAlign: "center",
            marginTop: "auto",
            pageBreakInside: "avoid",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "9px",
              color: BRAND.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontFamily: "monospace",
            }}
          >
            Report ID: {interview.id.toUpperCase()} &bull; Generated by AI Assistant
          </p>
        </div>
      </div>
    </div>
  );
}
