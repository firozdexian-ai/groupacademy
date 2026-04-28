import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * GroUp Academy: Pedagogical Credential Issuance Engine
 * CTO Reference: Authoritative utility for landscape certificate generation.
 * Logic: High-density rasterization with Landscape A4 aspect ratio synchronization.
 */

export async function generateCertificatePDF(holderName: string, courseTitle: string): Promise<boolean> {
  const element = document.getElementById("certificate-pdf-content");

  if (!element) {
    console.error("[Sentinel] REGISTRY_FAULT: Certificate DOM node not found.");
    return false;
  }

  try {
    // PHASE: High-Intensity_Rasterization
    const canvas = await html2canvas(element, {
      scale: 2, // 2x Density for professional print fidelity
      useCORS: true, // Allow institutional branding & seal ingress
      logging: false,
      backgroundColor: "#ffffff",
    });

    // PHASE: Landscape_Geometry_Handshake
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 297; // Standard A4 Landscape Width (mm)
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // HUD: Render artifact to PDF binary
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);

    // HUD: Filename_Sanitization_Protocol
    const safeName = holderName.replace(/[^a-z0-9]/gi, "_");
    const safeTitle = courseTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 30);

    // ACTION: Commit binary to talent device
    pdf.save(`GroUp_Certificate_${safeName}_${safeTitle}.pdf`);

    return true;
  } catch (err) {
    console.error("[Sentinel] CREDENTIAL_INGRESS_FAULT:", err);
    return false;
  }
}
