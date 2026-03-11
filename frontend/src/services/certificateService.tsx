import { ImageResponse } from "@vercel/og";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";
import { CERTIFICATE_CONFIG, getSmartFontSize } from "@/config/certificateConfig";

// Font is stored locally
const fontPath = path.join(
  process.cwd(),
  "public",
  "cert-template",
  CERTIFICATE_CONFIG.text.fontFile
);

export const generateCertificate = async (name: string): Promise<string> => {
  try {
    const bgImagePath = path.join(
      process.cwd(),
      "public",
      "cert-template",
      "cert-template.png"
    );

    let bgBase64 = "";
    if (fs.existsSync(bgImagePath)) {
      const bgData = fs.readFileSync(bgImagePath);
      bgBase64 = `data:image/png;base64,${bgData.toString("base64")}`;
    } else {
      logger.warn(
        "Certificate template missing at public/cert-template/cert-template.png"
      );
    }

    // Fetch the Montserrat font locally
    let fontData: ArrayBuffer;
    if (fs.existsSync(fontPath)) {
      const fontBuffer = fs.readFileSync(fontPath);
      fontData = fontBuffer.buffer.slice(
        fontBuffer.byteOffset,
        fontBuffer.byteOffset + fontBuffer.byteLength
      );
    } else {
      throw new Error("Montserrat font missing at " + fontPath);
    }

    // Calculate dynamic font size based on name length
    const dynamicFontSize = getSmartFontSize(name.length);

    // Create the image response using Vercel OG
    const response = new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
            ...(bgBase64
              ? {
                  backgroundImage: `url(${bgBase64})`,
                  backgroundSize: "100% 100%",
                }
              : { backgroundColor: "#f0f0f0" }),
          }}
        >
          {!bgBase64 && (
            <div
              style={{
                position: "absolute",
                top: 20,
                color: "red",
                fontSize: 24,
              }}
            >
              Missing Template: public/cert-template/cert-template.png
            </div>
          )}
          <div
            style={{
              position: "absolute",
              left: CERTIFICATE_CONFIG.text.x,
              top: CERTIFICATE_CONFIG.text.y,
              width: CERTIFICATE_CONFIG.text.width,
              height: CERTIFICATE_CONFIG.text.height,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: dynamicFontSize,
              fontFamily: CERTIFICATE_CONFIG.text.fontFamily,
              color: CERTIFICATE_CONFIG.text.color,
              fontWeight: CERTIFICATE_CONFIG.text.fontWeight,
              fontStyle: CERTIFICATE_CONFIG.text.fontStyle,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
        </div>
      ),
      {
        width: CERTIFICATE_CONFIG.templateWidth,
        height: CERTIFICATE_CONFIG.templateHeight,
        fonts: [
          {
            name: "Montserrat",
            data: fontData,
            style: CERTIFICATE_CONFIG.text.fontStyle,
            weight: CERTIFICATE_CONFIG.text.fontWeight,
          },
        ],
      }
    );

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch (error) {
    logger.error("Failed to generate certificate", error);
    throw new Error("Failed to generate certificate");
  }
};
