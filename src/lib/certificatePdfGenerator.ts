import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function generateCertificatePDF(holderName: string, courseTitle: string): Promise<boolean> {
  const element = document.getElementById("certificate-pdf-content");
  if (!element) {
    console.error("Certificate PDF element not found");
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Landscape A4
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 297; // A4 landscape width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgWidth, imgHeight);

    const sanitizedName = holderName.replace(/[^a-z0-9]/gi, "_");
    pdf.save(`Certificate_${sanitizedName}_${courseTitle.replace(/[^a-z0-9]/gi, "_").slice(0, 30)}.pdf`);

    return true;
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    return false;
  }
}
