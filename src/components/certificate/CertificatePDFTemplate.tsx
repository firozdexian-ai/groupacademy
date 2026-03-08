import { format } from "date-fns";

interface CertificateData {
  holder_name: string;
  course_title: string;
  verify_code: string;
  percentage: number | null;
  score: number | null;
  total_questions: number | null;
  issued_at: string;
}

interface CertificatePDFTemplateProps {
  data: CertificateData;
}

const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  dark: "#1a1a1a",
  muted: "#6b7280",
};

export function CertificatePDFTemplate({ data }: CertificatePDFTemplateProps) {
  const verifyUrl = `${window.location.origin}/verify/${data.verify_code}`;

  return (
    <div
      id="certificate-pdf-content"
      style={{
        width: "1122px",
        height: "794px",
        padding: "0",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Decorative border */}
      <div style={{
        position: "absolute",
        inset: "12px",
        border: `3px solid ${BRAND.primary}`,
        borderRadius: "8px",
        pointerEvents: "none",
      }} />

      {/* Corner accents */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute",
          width: "60px",
          height: "60px",
          background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.secondary})`,
          opacity: 0.15,
          borderRadius: i === 0 ? "0 0 60px 0" : i === 1 ? "0 0 0 60px" : i === 2 ? "0 60px 0 0" : "60px 0 0 0",
          ...pos,
        } as any} />
      ))}

      {/* Content */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "50px 80px",
        textAlign: "center",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "8px" }}>
          <h1 style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 700,
            color: BRAND.primary,
            letterSpacing: "1px",
          }}>
            GroUp Academy
          </h1>
        </div>

        {/* Divider */}
        <div style={{
          width: "120px",
          height: "3px",
          background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
          borderRadius: "2px",
          marginBottom: "16px",
        }} />

        <p style={{
          margin: "0 0 24px",
          fontSize: "13px",
          textTransform: "uppercase",
          letterSpacing: "4px",
          color: BRAND.muted,
          fontWeight: 600,
        }}>
          Certificate of Completion
        </p>

        <p style={{
          margin: "0 0 8px",
          fontSize: "14px",
          color: BRAND.muted,
        }}>
          This is to certify that
        </p>

        {/* Name */}
        <h2 style={{
          margin: "0 0 20px",
          fontSize: "42px",
          fontWeight: 700,
          color: BRAND.dark,
          borderBottom: `2px solid ${BRAND.secondary}`,
          paddingBottom: "8px",
          display: "inline-block",
        }}>
          {data.holder_name}
        </h2>

        <p style={{
          margin: "0 0 12px",
          fontSize: "14px",
          color: BRAND.muted,
        }}>
          has successfully completed the course
        </p>

        {/* Course Title */}
        <h3 style={{
          margin: "0 0 24px",
          fontSize: "24px",
          fontWeight: 600,
          color: BRAND.primary,
          maxWidth: "700px",
        }}>
          {data.course_title}
        </h3>

        {/* Score badge */}
        {data.percentage !== null && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#ecfdf5",
            padding: "10px 28px",
            borderRadius: "30px",
            marginBottom: "24px",
          }}>
            <span style={{ fontSize: "14px", color: BRAND.accent, fontWeight: 600 }}>
              ✓ Assessment Score: {data.score}/{data.total_questions} ({data.percentage}%)
            </span>
          </div>
        )}

        {/* Date */}
        <p style={{
          margin: "0 0 32px",
          fontSize: "13px",
          color: BRAND.muted,
        }}>
          Issued on {format(new Date(data.issued_at), "MMMM d, yyyy")}
        </p>

        {/* Signature line */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "120px",
          width: "100%",
          maxWidth: "600px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "180px",
              borderBottom: "1px solid #d1d5db",
              marginBottom: "6px",
              paddingBottom: "4px",
              fontSize: "14px",
              fontWeight: 600,
              fontStyle: "italic",
              color: BRAND.dark,
            }}>
              GroUp Academy
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: BRAND.muted }}>Issuing Authority</p>
          </div>
        </div>

        {/* Footer verification */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          left: "80px",
          right: "80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "10px",
          color: BRAND.muted,
        }}>
          <span>Verify: {verifyUrl}</span>
          <span>Code: {data.verify_code}</span>
          <span>© {new Date().getFullYear()} GroUp Academy</span>
        </div>
      </div>
    </div>
  );
}
