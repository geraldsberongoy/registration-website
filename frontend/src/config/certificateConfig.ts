/**
 * Configuration for the Certificate Generation Service.
 * Modify these values to easily adjust the text positioning and appearance
 * without touching the core generator logic.
 */
export const CERTIFICATE_CONFIG = {
  // Dimensions of the background template image
  templateWidth: 3508,
  templateHeight: 2480,

  // Text bounding box based on the template design
  text: {
    x: 934.6, // Left position
    y: 993.1, // Top position
    width: 2407.3, // Width of the bounding box
    height: 182.5, // Height of the bounding box

    // Font styling
    color: "#2490ab",
    fontSize: 110, // Base size used to calculate scaling
    minFontSize: 50, // Don't go below this
    maxFontSize: 140, // Don't go above this
    fontFamily: '"Montserrat"', // Base font family name
    fontFile: "Montserrat-BoldItalic.ttf", // The exact TTF file to load
    fontWeight: 700 as const,
    fontStyle: "italic" as const,
  },
};

/**
 * Smart font size calculator to fit long names within the bounding box
 * Scales dynamically based on: 35 characters = CERTIFICATE_CONFIG.text.fontSize.
 * Caps at maxFontSize for shorter names.
 */
export const getSmartFontSize = (textLength: number): number => {
  if (textLength === 0) return CERTIFICATE_CONFIG.text.maxFontSize;

  // Dynamically base target on configured fontSize
  const targetWidth = 35 * CERTIFICATE_CONFIG.text.fontSize;
  const calculatedSize = Math.floor(targetWidth / textLength);

  return Math.max(
    CERTIFICATE_CONFIG.text.minFontSize,
    Math.min(CERTIFICATE_CONFIG.text.maxFontSize, calculatedSize),
  );
};
