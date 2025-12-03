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

const performanceLevelLabels: Record<string, string> = {
  needs_work: "Needs Work",
  developing: "Developing",
  competent: "Competent",
  strong: "Strong",
  excellent: "Excellent"
};

export function MockInterviewPDFTemplate({ interview }: Props) {
  const selectionPercentage = interview.selection_percentage || 0;
  const performanceLevel = interview.performance_level || "needs_work";

  const getQuestionById = (questionId: string) => {
    return interview.questions.find(q => q.id === questionId);
  };

  return (
    <div
      id="mock-interview-pdf-content"
      style={{
        width: "794px",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#ffffff",
        color: "#1f2937"
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "3px solid #0066cc", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 8px 0", color: "#0066cc" }}>
          Mock Interview Report
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
          GroUp Academy - AI-Powered Interview Preparation
        </p>
      </div>

      {/* Candidate Info */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: "0 0 8px 0" }}>
            {interview.full_name}
          </h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 4px 0" }}>
            {interview.email}
          </p>
          {interview.job_title && (
            <p style={{ fontSize: "14px", color: "#374151", margin: 0 }}>
              Position: {interview.job_title}
              {interview.company_name && ` at ${interview.company_name}`}
            </p>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
            Date: {new Date(interview.completed_at || interview.created_at).toLocaleDateString()}
          </p>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 4px 0" }}>
            Difficulty: {interview.difficulty}
          </p>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
            Questions: {interview.question_count}
          </p>
        </div>
      </div>

      {/* Score Section */}
      <div style={{ textAlign: "center", marginBottom: "30px", backgroundColor: "#0066cc", color: "white", padding: "30px", borderRadius: "12px" }}>
        <div style={{ fontSize: "64px", fontWeight: "bold", margin: "0 0 8px 0" }}>
          {selectionPercentage}%
        </div>
        <div style={{ fontSize: "18px", marginBottom: "8px" }}>Selection Score</div>
        <div style={{ 
          display: "inline-block", 
          backgroundColor: "rgba(255,255,255,0.2)", 
          padding: "6px 16px", 
          borderRadius: "20px",
          fontSize: "14px"
        }}>
          {performanceLevelLabels[performanceLevel]}
        </div>
      </div>

      {/* Overall Feedback */}
      {interview.ai_feedback?.overall_feedback && (
        <div style={{ marginBottom: "30px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#0066cc" }}>
            Overall Assessment
          </h3>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>
            {interview.ai_feedback.overall_feedback}
          </p>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        {/* Strengths */}
        <div style={{ flex: 1, backgroundColor: "#ecfdf5", padding: "16px", borderRadius: "8px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#059669", marginBottom: "12px" }}>
            ✓ Strengths
          </h4>
          {interview.strengths && interview.strengths.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
              {interview.strengths.map((s, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{s}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "13px", color: "#6b7280" }}>No strengths identified</p>
          )}
        </div>

        {/* Improvements */}
        <div style={{ flex: 1, backgroundColor: "#fff7ed", padding: "16px", borderRadius: "8px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#ea580c", marginBottom: "12px" }}>
            ↑ Areas to Improve
          </h4>
          {interview.improvement_areas && interview.improvement_areas.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", lineHeight: "1.6" }}>
              {interview.improvement_areas.map((a, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{a}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "13px", color: "#6b7280" }}>No improvement areas identified</p>
          )}
        </div>
      </div>

      {/* Interview Tips */}
      {interview.ai_feedback?.interview_tips && (
        <div style={{ marginBottom: "30px", backgroundColor: "#eff6ff", padding: "16px", borderRadius: "8px", borderLeft: "4px solid #0066cc" }}>
          <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#0066cc", marginBottom: "8px" }}>
            💡 Interview Tips for This Role
          </h4>
          <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#374151", margin: 0 }}>
            {interview.ai_feedback.interview_tips}
          </p>
        </div>
      )}

      {/* Question Feedback */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "16px", color: "#0066cc" }}>
          Question-by-Question Feedback
        </h3>
        {interview.ai_feedback?.question_feedback?.map((feedback, idx) => {
          const question = getQuestionById(feedback.question_id);
          
          return (
            <div key={feedback.question_id} style={{ marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: "11px", 
                    backgroundColor: "#e5e7eb", 
                    padding: "2px 8px", 
                    borderRadius: "4px",
                    marginRight: "8px"
                  }}>
                    Q{idx + 1}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    {question?.question}
                  </span>
                </div>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  backgroundColor: feedback.score >= 7 ? "#10b981" : feedback.score >= 5 ? "#f59e0b" : "#ef4444",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "16px",
                  flexShrink: 0,
                  marginLeft: "12px"
                }}>
                  {feedback.score}
                </div>
              </div>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "8px", paddingLeft: "12px", borderLeft: "2px solid #d1d5db" }}>
                {feedback.feedback}
              </p>
              {feedback.improvement_tips && (
                <p style={{ fontSize: "12px", color: "#0066cc", margin: 0 }}>
                  <strong>Tip:</strong> {feedback.improvement_tips}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", paddingTop: "20px", borderTop: "2px solid #e5e7eb" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af", margin: "0 0 4px 0" }}>
          Report ID: {interview.id.slice(0, 8).toUpperCase()}
        </p>
        <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>
          Generated by GroUp Academy • www.groupacademy.com
        </p>
      </div>
    </div>
  );
}
