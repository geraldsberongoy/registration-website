import jsPDF from "jspdf";

/**
 * Converts SVG base64 string to PDF and triggers download.
 * Renders SVG to canvas, then embeds as PNG in PDF — simple, reliable, browser-native.
 */
export async function downloadSvgAsPdf(
  svgBase64: string,
  fileName: string,
): Promise<void> {
  try {
    // 1. Decode base64 SVG to data URI
    const svgDataUri = `data:image/svg+xml;base64,${svgBase64}`;

    // 2. Create image from SVG
    const img = new Image();
    img.src = svgDataUri;

    // Wait for image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load SVG image"));
    });

    // 3. Get SVG dimensions (assumed to be A4 landscape certificate — 3508x2480 px)
    const canvasWidth = img.width || 3508;
    const canvasHeight = img.height || 2480;

    // 4. Create canvas and render SVG to it
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }
    ctx.drawImage(img, 0, 0);

    // 5. Convert canvas to PNG data URI
    const pngDataUri = canvas.toDataURL("image/png");

    // 6. Convert dimensions to PDF (mm)
    // Standard: 96 DPI screen to 25.4 mm/inch conversion
    const pdfWidth = (canvasWidth / 96) * 25.4;
    const pdfHeight = (canvasHeight / 96) * 25.4;

    // 7. Create PDF with exact certificate dimensions
    const pdf = new jsPDF({
      orientation: canvasWidth > canvasHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    // 8. Embed the PNG image in the PDF (fill entire page)
    pdf.addImage(pngDataUri, "PNG", 0, 0, pdfWidth, pdfHeight);

    // 9. Trigger download
    pdf.save(fileName);
  } catch (err) {
    console.error("Failed to convert SVG to PDF:", err);
    throw new Error(
      "Failed to generate PDF. Try using the SVG download instead.",
    );
  }
}
