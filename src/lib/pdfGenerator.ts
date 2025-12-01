import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReportData {
  student: {
    full_name: string;
    student_id: string;
  };
  content: {
    title: string;
  };
}

export async function generateReportCardPDF(data: ReportData) {
  const element = document.getElementById("report-card-content");
  if (!element) {
    throw new Error("Report card content not found");
  }

  // Convert HTML to canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    backgroundColor: "#ffffff",
  });

  // Calculate PDF dimensions
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const imgData = canvas.toDataURL("image/png");
  
  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  
  // Generate filename
  const filename = `ReportCard_${data.student.student_id}_${data.content.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
  
  // Download
  pdf.save(filename);
}
