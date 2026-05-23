import { useMemo } from "react";
import { format, isValid } from "date-fns";

/**
 * GroUp Academy: Institutional Completion Artifact Blueprint (V5.6.0)
 * CTO Reference: High-fidelity landscape printable DOM template optimized for background pdf canvas captures.
 * Architecture: Reference-stable temporal anchoring guaranteeing copyright and data token continuity.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

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
  dark: "#0F172A",
  muted: "#64748B",
  border: "rgba(42, 125, 222, 0.2)",
};

export function CertificatePDFTemplate({ data }: CertificatePDFTemplateProps) {
  // Create reference-stable base verification urls derived safely from window constraints
  const verifyUrl = useMemo(() => {
    const originHost = window?.location?.origin || "https://group.academy";
    return `${originHost}/verify/${String(data?.verify_code || "UNKNOWN_NODE")}`;
  }, [data?.verify_code]);

  // --- PHASE: SAFE_TEMPORAL_LEDGER_RESOLUTION ---
  const normalizedTemporalContext = useMemo(() => {
    const rawIssuedAtString = data?.issued_at;
    if (!rawIssuedAtString) {
      return { formattedDate: "00_JAN_0000", structuralYear: "2026" };
    }

    const parsedDateInstance = new Date(rawIssuedAtString);
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
  }, [data?.issued_at]);

  // --- PHASE: LAYOUT_TEXT_NORMALIZATION ---
  const sanitizedStringsLedger = useMemo(() => {
    return {
      holderNameUppercase: String(data?.holder_name || "Anonymous")
        .trim()
        .toUpperCase(),
      courseTitleUppercase: String(data?.course_title || "Course")
        .trim()
        .toUpperCase(),
      verifyCodeClean: String(data?.verify_code || "N/A")
        .trim()
        .toUpperCase(),
    };
  }, [data?.holder_name, data?.course_title, data?.verify_code]);

  return (
    <div
      id="certificate-pdf-content"
      style={{
        width: "1122px", // Authoritative A4 Dimensions Landscape pixel boundary bounds
        height: "794px",
        padding: "0",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px", // Placed cleanly outside regular viewer space for off-screen canvas rendering calls
        top: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* HUD: EXTERNAL_DECORATIVE_FRAME */}
      <div
        style={{
          position: "absolute",
          inset: "20px",
          border: `2px solid ${BRAND.primary}`,
          borderRadius: "4px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "30px",
          border: `1px solid ${BRAND.border}`,
          borderRadius: "2px",
          pointerEvents: "none",
        }}
      />

      {/* COMPONENT: CORNER_SYNC_NODES */}
      {[
        { top: 0, left: 0, borderRadius: "0 0 100px 0" },
        { top: 0, right: 0, borderRadius: "0 0 0 100px" },
        { bottom: 0, left: 0, borderRadius: "0 100px 0 0" },
        { bottom: 0, right: 0, borderRadius: "100px 0 0 0" },
      ].map((cornerStyle, idx) => (
        <div
          key={`corner-geometry-${idx}`}
          style={
            {
              position: "absolute",
              width: "120px",
              height: "120px",
              background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}15)`,
              ...cornerStyle,
            } as any
          }
        />
      ))}

      {/* VIEWPORT: ARTIFACT_CONTENT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "60px 100px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* HUD: INSTITUTIONAL_HEADER */}
        <div style={{ marginBottom: "12px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: 900,
              color: BRAND.primary,
              letterSpacing: "-1px",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            GroUp_Academy
          </h1>
        </div>

        <div
          style={{
            width: "160px",
            height: "4px",
            background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
            borderRadius: "2px",
            marginBottom: "24px",
          }}
        />

        <p
          style={{
            margin: "0 0 40px",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "6px",
            color: BRAND.muted,
            fontWeight: 800,
          }}
        >
          Credential_of_Completion
        </p>

        <p style={{ margin: "0 0 12px", fontSize: "16px", fontStyle: "italic", color: BRAND.muted }}>
          This system verifies that
        </p>

        {/* IDENTITY: HOLDER_NAME */}
        <h2
          style={{
            margin: "0 0 24px",
            fontSize: "52px",
            fontWeight: 900,
            color: BRAND.dark,
            borderBottom: `4px solid ${BRAND.secondary}`,
            paddingBottom: "10px",
            display: "inline-block",
            letterSpacing: "-2px",
          }}
        >
          {sanitizedStringsLedger.holderNameUppercase}
        </h2>

        <p style={{ margin: "0 0 16px", fontSize: "16px", color: BRAND.muted }}>
          has synchronized mastery in the curriculum of
        </p>

        {/* ARTIFACT: COURSE_TITLE */}
        <h3
          style={{
            margin: "0 0 32px",
            fontSize: "28px",
            fontWeight: 800,
            color: BRAND.primary,
            maxWidth: "800px",
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
          }}
        >
          {sanitizedStringsLedger.courseTitleUppercase}
        </h3>

        {/* HUD: METRIC_SYNC */}
        {data.percentage !== null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "15px",
              backgroundColor: "#F0FDF4",
              border: "1px solid rgba(16, 213, 118, 0.2)",
              padding: "12px 32px",
              borderRadius: "16px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                color: BRAND.accent,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "monospace",
              }}
            >
              ✓ Diagnostic_Yield: {Number(data.score)}/{Number(data.total_questions)} ({Number(data.percentage)}%)
            </span>
          </div>
        )}

        {/* HUD: SIGNATURE_AUTHORITY */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginTop: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "220px",
                borderBottom: `1px solid ${BRAND.muted}40`,
                marginBottom: "8px",
                paddingBottom: "8px",
                fontSize: "18px",
                fontWeight: 800,
                fontStyle: "italic",
                color: BRAND.dark,
                letterSpacing: "-0.5px",
              }}
            >
              GroUp_Registry
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                color: BRAND.muted,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Issuing_Authority
            </p>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "11px",
                fontWeight: 700,
                color: BRAND.primary,
                fontFamily: "monospace",
              }}
            >
              {normalizedTemporalContext.formattedDate}
            </p>
          </div>
        </div>

        {/* HUD: VERIFICATION_LEDGER */}
        <div
          style={{
            position: "absolute",
            bottom: "35px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "9px",
            fontWeight: 700,
            color: BRAND.muted,
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "monospace",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span style={{ display: "block", marginBottom: "4px" }}>System_Verify: {verifyUrl}</span>
            <span>Artifact_ID: {sanitizedStringsLedger.verifyCodeClean}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", marginBottom: "4px" }}>Verification_Status: LEVEL_1_VERIFIED</span>
            <span>© {normalizedTemporalContext.structuralYear} GroUp_Academy_Neural_Registry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
