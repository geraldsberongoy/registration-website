import satori from "satori";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";
import { CertificateConfig } from "@/types/event";
import {
  DEFAULT_CERTIFICATE_CONFIG,
  getSmartFontSize,
} from "@/config/certificateConfig";
import { getEventDetails } from "@/services/eventService";

// Font base directory — fonts are always loaded from local files
const fontDir = path.join(process.cwd(), "public", "cert-template");

// In-memory caches (persist across requests in the same Lambda instance)
const templateImageCache = new Map<string, string>();
const fontFileCache = new Map<string, ArrayBuffer>();
const eventConfigCache = new Map<string, any>();

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;
const templateCacheTimestamps = new Map<string, number>();
const fontCacheTimestamps = new Map<string, number>();
const eventCacheTimestamps = new Map<string, number>();

/**
 * Fetch and cache template image from Supabase Storage
 */
const fetchTemplateWithCache = async (templateUrl: string): Promise<string> => {
  const now = Date.now();
  const cachedTimestamp = templateCacheTimestamps.get(templateUrl);

  // Return cached if still valid
  if (
    templateImageCache.has(templateUrl) &&
    cachedTimestamp &&
    now - cachedTimestamp < CACHE_TTL
  ) {
    logger.info(`[Cache HIT] Template image: ${templateUrl}`);
    return templateImageCache.get(templateUrl)!;
  }

  logger.info(`[Cache MISS] Fetching template: ${templateUrl}`);
  const templateResponse = await fetch(templateUrl);
  if (!templateResponse.ok) {
    throw new Error(
      `Failed to fetch certificate template from URL: ${templateUrl}`,
    );
  }

  const arrayBuffer = await templateResponse.arrayBuffer();
  const bgBuffer = Buffer.from(arrayBuffer);
  const contentType =
    templateResponse.headers.get("content-type") || "image/png";
  const bgBase64 = `data:${contentType};base64,${bgBuffer.toString("base64")}`;

  // Cache the result
  templateImageCache.set(templateUrl, bgBase64);
  templateCacheTimestamps.set(templateUrl, now);

  return bgBase64;
};

/**
 * Load and cache font file from local filesystem
 */
const loadFontWithCache = async (
  fontFileName: string,
): Promise<ArrayBuffer> => {
  const now = Date.now();
  const cachedTimestamp = fontCacheTimestamps.get(fontFileName);

  // Return cached if still valid
  if (
    fontFileCache.has(fontFileName) &&
    cachedTimestamp &&
    now - cachedTimestamp < CACHE_TTL
  ) {
    logger.info(`[Cache HIT] Font file: ${fontFileName}`);
    return fontFileCache.get(fontFileName)!;
  }

  logger.info(`[Cache MISS] Loading font: ${fontFileName}`);
  const fontPath = path.join(fontDir, fontFileName);
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file missing: ${fontPath}`);
  }

  const fontBuffer = fs.readFileSync(fontPath);
  const fontData: ArrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength,
  );

  // Cache the result
  fontFileCache.set(fontFileName, fontData);
  fontCacheTimestamps.set(fontFileName, now);

  return fontData;
};

/**
 * Core rendering function — renders a certificate image given a name and a fully-resolved config.
 * Both the survey action and the admin preview API route call this.
 */
export const renderCertificateImage = async (
  name: string,
  certConfig: CertificateConfig,
): Promise<string> => {
  // 1. Fetch the background template from Supabase Storage (with cache)
  const bgBase64 = await fetchTemplateWithCache(certConfig.templateUrl!);

  // 2. Load the Montserrat font variation from local public files (with cache)
  const fontData = await loadFontWithCache(certConfig.text.fontFile);

  // 3. Calculate dynamic font size
  const dynamicFontSize = getSmartFontSize(name.length, certConfig.text);

  // 4. Render SVG with Satori
  const svg = await satori(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        backgroundImage: `url(${bgBase64})`,
        backgroundSize: "100% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: certConfig.text.x,
          top: certConfig.text.y,
          width: certConfig.text.width,
          height: certConfig.text.height,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: dynamicFontSize,
            fontFamily: "Montserrat",
            color: certConfig.text.color,
            fontWeight: certConfig.text.fontWeight as any,
            fontStyle: certConfig.text.fontStyle,
            textAlign: "center",
            whiteSpace: "nowrap",
            lineHeight: 1,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          {name}
        </span>
      </div>
    </div>,
    {
      width: 3508,
      height: 2480,
      fonts: [
        {
          name: "Montserrat",
          data: fontData,
          style: certConfig.text.fontStyle,
          weight: certConfig.text.fontWeight as any,
        },
      ],
    },
  );

  // 5. Return Base64-encoded SVG string
  return Buffer.from(svg).toString("base64");
};

/**
 * Generates a certificate for a submitted survey.
 * Fetches the event's certificate config from the database.
 */
export const generateCertificate = async (
  name: string,
  eventSlug: string,
): Promise<string> => {
  try {
    const now = Date.now();
    const cachedEventTimestamp = eventCacheTimestamps.get(eventSlug);

    // Check event config cache
    let event: any;
    if (
      eventConfigCache.has(eventSlug) &&
      cachedEventTimestamp &&
      now - cachedEventTimestamp < CACHE_TTL
    ) {
      logger.info(`[Cache HIT] Event config: ${eventSlug}`);
      event = eventConfigCache.get(eventSlug);
    } else {
      logger.info(`[Cache MISS] Fetching event config: ${eventSlug}`);
      event = await getEventDetails(eventSlug);
      eventConfigCache.set(eventSlug, event);
      eventCacheTimestamps.set(eventSlug, now);
    }

    if (!event.certificateConfig || !event.certificateConfig.templateUrl) {
      throw new Error(
        `Certificate not configured for event "${eventSlug}". Please upload a template and save the configuration in the admin panel.`,
      );
    }

    // Deep-merge with defaults to fill in any missing properties added after initial save.
    const certConfig: CertificateConfig = {
      ...DEFAULT_CERTIFICATE_CONFIG,
      ...event.certificateConfig,
      text: {
        ...DEFAULT_CERTIFICATE_CONFIG.text,
        ...event.certificateConfig.text,
      },
      isEnabled: true,
    };

    return await renderCertificateImage(name, certConfig);
  } catch (error) {
    logger.error("Failed to generate certificate", error);
    throw error;
  }
};
