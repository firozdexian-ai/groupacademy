import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateProfileSummaryPDF = async (fullName: string): Promise<void> => {
  const element = document.getElementById('profile-summary-pdf-content');
  if (!element) {
    throw new Error('Profile summary PDF content not found');
  }

  // Make element visible for capture
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0';
  document.body.appendChild(element);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const sanitizedName = fullName.replace(/[^a-zA-Z0-9]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    pdf.save(`ProfileSummary_${sanitizedName}_${date}.pdf`);
  } finally {
    // Clean up - remove the element from body if it was appended
    if (element.parentNode === document.body) {
      document.body.removeChild(element);
    }
  }
};
