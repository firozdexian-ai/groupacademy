import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * GroUp Academy: Credential Issuance Engine
 * CTO Reference: Authoritative utility for dynamic PDF artifact generation.
 * Logic: Implements high-density rasterization with off-screen rendering.
 */

interface Assessment {
  id: string;
  full_name: string;
  profession_categories?: {
    name: string;
  };
}

/**
 * PHASE: Artifact_Rasterization
 * Converts DOM nodes into high-fidelity PDF binaries.
 */
export async function generateScorecardPDF(assessment: Assessment) {
  const element = document.getElementById("scorecard-pdf-content");
  if (!element) {
    throw new Error("REGISTRY_FAULT: Scorecard template node not found.");
  }

  // HUD: Off-Screen Rendering Protocol
  // Temporarily reposition element to ensure full-capture without viewport interference.
  const originalPosition = element.style.position;
  const originalLeft = element.style.left;
  const originalVisibility = element.style.visibility;

  element.style.position = "fixed";
  element.style.left = "-9999px"; // Move far off-screen
  element.style.visibility = "visible";

  try {
    // HUD: High-Intensity Canvas Generation
    const canvas = await html2canvas(element, {
      scale: 2, // 2x Density for print quality
      logging: false,
      backgroundColor: "#ffffff",
      useCORS: true, // Allow institutional asset ingress
      allowTaint: false,
    });

    // PHASE: PDF_Geometry_Calculation
    const imgWidth = 210; // Standard A4 Width (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/png", 1.0);

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight, undefined, "FAST");

    // HUD: Institutional Filename Sanitization
    const sanitizedName = assessment.full_name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const date = new Date().toISOString().split("T")[0];
    const filename = `GroUp_Scorecard_${sanitizedName}_${date}.pdf`;

    // ACTION: Commit binary to talent device
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error("CREDENTIAL_GENERATION_FAULT:", err);
    throw err;
  } finally {
    // RESTORE: Revert DOM artifacts to original state
    element.style.position = originalPosition;
    element.style.left = originalLeft;
    element.style.visibility = originalVisibility;
  }
}
