/**
 * server.ts - Full-Stack Express Server for VibeCart AI.
 * Implements the VibeCart API endpoints and mounts Vite middleware for development & production.
 *
 * Exposes:
 * - GET  /health
 * - POST /api/v1/authenticate
 * - GET  /api/v1/products
 * - GET  /api/v1/products/:id
 * - POST /api/v1/watchlist
 * - GET  /api/v1/watchlist/:user_id
 * - DELETE /api/v1/watchlist/:user_id/:product_id
 * - POST /api/v1/events/price-update
 */

import "dotenv/config";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Safe directory resolution for both dev (tsx) and production bundle (CJS)
const appDir = typeof __dirname !== "undefined" ? __dirname : process.cwd();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "10mb" }));

// ---------------------------------------------------------------------------
// Seed Catalog Data (Mirroring vibecart/database.py)
// ---------------------------------------------------------------------------
interface CatalogItem {
  product_id: string;
  vendor: string;
  title: string;
  description: string;
  category: string;
  color: string;
  dominant_color?: string | null;
  dominant_color_confidence?: number | null;
  material: string;
  style_tags: string[];
  listed_price: number;
  advertised_mrp: number | null;
  historical_median_price: number;
  historical_average_price: number;
  historical_min_price: number;
  historical_max_price: number;
  observation_count: number;
  first_observed_at: string;
  last_observed_at: string;
  vendor_trust_score: number;
  image_url: string;
  competitor?: string;
  source_url?: string;
  has_purchase_link?: boolean;
  retailer_display?: string;
}

const now = new Date();
const tenDaysAgo = new Date(now.getTime() - 10 * 86400000).toISOString();
const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
const twoHundredDaysAgo = new Date(now.getTime() - 200 * 86400000).toISOString();

const SEED_FIXTURES: CatalogItem[] = [
  {
    product_id: "VB-DRESS-001",
    vendor: "Anaya Couture",
    title: "Summer Evening Cotton Dress with Pot Neck & Rhombus Ruffles",
    description:
      "Breathable cotton A-line dress featuring a delicate pot-neck back design with dori ties and rhombus-shaped tiered ruffles along the hemline. Perfect for summer garden parties.",
    category: "dress",
    color: "ivory",
    dominant_color: "white",
    dominant_color_confidence: 0.95,
    material: "cotton",
    style_tags: ["pot neck", "dori ties", "rhombus ruffles", "summer dress", "back tie"],
    listed_price: 2199.0,
    advertised_mrp: 2999.0,
    historical_median_price: 2650.0,
    historical_average_price: 2680.0,
    historical_min_price: 2150.0,
    historical_max_price: 2999.0,
    observation_count: 28,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.95,
    image_url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-DRESS-002",
    vendor: "FastChic Trends",
    title: "Pot Neck Tiered Georgette Dress with Dori Latkan and Rhombus Trims",
    description:
      "Festive georgette dress with a deep pot neck, back dori string ties, and distinctive rhombus ruffles along the flare.",
    category: "dress",
    color: "maroon",
    dominant_color: "maroon",
    dominant_color_confidence: 0.95,
    material: "georgette",
    style_tags: ["pot neck", "dori ties", "rhombus ruffles", "latkan", "evening"],
    listed_price: 2450.0,
    advertised_mrp: 4999.0,
    historical_median_price: 1850.0,
    historical_average_price: 1820.0,
    historical_min_price: 1600.0,
    historical_max_price: 2000.0,
    observation_count: 22,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.62,
    image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-DRESS-003",
    vendor: "Kala Mandir",
    title: "Handblock Floral Pot Neck Midi Dress with Tassel Ties",
    description:
      "Handblock printed casual dress with traditional pot neck back opening and drawstring dori ties. Hem features standard gathered pleats.",
    category: "dress",
    color: "indigo blue",
    dominant_color: "blue",
    dominant_color_confidence: 0.95,
    material: "mulmul cotton",
    style_tags: ["pot neck", "dori ties", "tassel back", "block print", "midi dress"],
    listed_price: 2350.0,
    advertised_mrp: 2500.0,
    historical_median_price: 2350.0,
    historical_average_price: 2360.0,
    historical_min_price: 2200.0,
    historical_max_price: 2500.0,
    observation_count: 19,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.9,
    image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-DRESS-004",
    vendor: "Boutique Indie",
    title: "Artisanal Silk-Cotton Dress with Pot Neck Cutout and Rhombus Pattern Ruffles",
    description:
      "Limited batch artisanal dress crafted with an ornate pot neck, golden dori ties, and geometric rhombus ruffles.",
    category: "dress",
    color: "emerald green",
    dominant_color: "green",
    dominant_color_confidence: 0.95,
    material: "silk blend",
    style_tags: ["pot neck", "dori ties", "rhombus ruffles", "boutique"],
    listed_price: 2200.0,
    advertised_mrp: 3200.0,
    historical_median_price: 2500.0,
    historical_average_price: 2500.0,
    historical_min_price: 2400.0,
    historical_max_price: 2600.0,
    observation_count: 2, // Sparse evidence (< 5 observations)
    first_observed_at: tenDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.7,
    image_url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-DRESS-005",
    vendor: "Luxe Pret",
    title: "Designer Raw Silk Gown with Pot Neck and Rhombus Embellished Ruffles",
    description:
      "High fashion runway piece with embroidered pot neck, dori back strings, and tiered rhombus shaped cascading ruffles.",
    category: "dress",
    color: "blush pink",
    dominant_color: "pink",
    dominant_color_confidence: 0.95,
    material: "raw silk",
    style_tags: ["pot neck", "dori ties", "rhombus ruffles", "luxury", "gown"],
    listed_price: 4500.0,
    advertised_mrp: 6000.0,
    historical_median_price: 4800.0,
    historical_average_price: 4900.0,
    historical_min_price: 4200.0,
    historical_max_price: 6000.0,
    observation_count: 15,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.98,
    image_url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-DRESS-007",
    vendor: "Noir & White",
    title: "Midnight Black Flared Dress with Statement Puff Sleeves",
    description:
      "Chic black evening dress designed with exaggerated puff sleeves, a structured square neckline, and subtle hem ruffles.",
    category: "dress",
    color: "black",
    dominant_color: "black",
    dominant_color_confidence: 0.98,
    material: "crepe",
    style_tags: ["black dress", "puff sleeves", "square neck", "cocktail", "party"],
    listed_price: 1899.0,
    advertised_mrp: 2499.0,
    historical_median_price: 2199.0,
    historical_average_price: 2250.0,
    historical_min_price: 1850.0,
    historical_max_price: 2499.0,
    observation_count: 24,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.91,
    image_url: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-ETHNIC-008",
    vendor: "Rivaaz Jaipur",
    title: "Festive Silk Anarkali Suit with Intricate Mirror Work & Latkans",
    description:
      "Traditional flared Anarkali kurta set featuring hand-placed mirror work around the yoke, tie-back latkans, and gota patti border.",
    category: "anarkali",
    color: "teal blue",
    dominant_color: "blue",
    dominant_color_confidence: 0.92,
    material: "chanderi silk",
    style_tags: ["anarkali", "mirror work", "latkans", "gota patti", "ethnic festive"],
    listed_price: 2799.0,
    advertised_mrp: 4200.0,
    historical_median_price: 3300.0,
    historical_average_price: 3450.0,
    historical_min_price: 2750.0,
    historical_max_price: 4200.0,
    observation_count: 31,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.94,
    image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-TOP-009",
    vendor: "Urban Dori",
    title: "Cutout Back Peplum Top with Criss-Cross Dori Tie Details",
    description:
      "Contemporary cropped peplum top featuring an asymmetrical cutout back opening laced with criss-cross tie cords.",
    category: "top",
    color: "olive green",
    dominant_color: "green",
    dominant_color_confidence: 0.92,
    material: "linen",
    style_tags: ["top", "unusual back design", "tie details", "cutout back", "peplum"],
    listed_price: 1450.0,
    advertised_mrp: 2100.0,
    historical_median_price: 1750.0,
    historical_average_price: 1790.0,
    historical_min_price: 1400.0,
    historical_max_price: 2100.0,
    observation_count: 18,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.88,
    image_url: "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800&q=80",
  },
  {
    product_id: "VB-BLOUSE-006",
    vendor: "Heritage Weaves",
    title: "Brocade Saree Blouse with Deep Pot Neck and Beaded Dori",
    description:
      "Classic bridal saree blouse with structured pot neck back and zardozi embellished dori ties.",
    category: "blouse",
    color: "red",
    dominant_color: "red",
    dominant_color_confidence: 0.95,
    material: "brocade",
    style_tags: ["pot neck", "dori ties", "saree blouse"],
    listed_price: 1800.0,
    advertised_mrp: 2200.0,
    historical_median_price: 1900.0,
    historical_average_price: 1920.0,
    historical_min_price: 1700.0,
    historical_max_price: 2200.0,
    observation_count: 25,
    first_observed_at: sixtyDaysAgo,
    last_observed_at: tenDaysAgo,
    vendor_trust_score: 0.92,
    image_url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
  },
];

// ---------------------------------------------------------------------------
// Curated Catalog Loading (catalog_fashion_data.json)
// ---------------------------------------------------------------------------
const rawCatalogPath = path.resolve(process.cwd(), "catalog_fashion_data.json");
let CURATED_CATALOG: CatalogItem[] = [];
if (fs.existsSync(rawCatalogPath)) {
  try {
    const rawData = fs.readFileSync(rawCatalogPath, "utf-8");
    const parsed: any[] = JSON.parse(rawData);
    CURATED_CATALOG = parsed.map((item) => {
      // Clean multi-image delimited string to primary URL
      const cleanImageUrl =
        typeof item.image_url === "string" && item.image_url.includes("~^")
          ? item.image_url.split("~^")[0]
          : item.image_url;

      return {
        ...item,
        image_url: cleanImageUrl,
        style_tags: Array.isArray(item.style_tags) ? item.style_tags : [],
      };
    });
    console.log(`[VibeCart] Successfully loaded ${CURATED_CATALOG.length} curated products from catalog_fashion_data.json`);
  } catch (e) {
    console.error("[VibeCart] Failed to parse catalog_fashion_data.json:", e);
  }
}

// Complete active catalog: Curated catalog records combined with seed fixtures
let CATALOG: CatalogItem[] = [...CURATED_CATALOG];
for (const fixture of SEED_FIXTURES) {
  if (!CATALOG.some((p) => p.product_id === fixture.product_id)) {
    CATALOG.push(fixture);
  }
}
console.log(`[VibeCart] Active catalog size: ${CATALOG.length} items (${CURATED_CATALOG.length} curated + ${SEED_FIXTURES.length} fixtures)`);

// In-Memory Watchlist Store
interface WatchlistEntry {
  user_id: string;
  product_id: string;
  target_price?: number | null;
  notify_on_authentic_deal_only: boolean;
  created_at: string;
}
const WATCHLIST_STORE: Map<string, WatchlistEntry> = new Map();

// ---------------------------------------------------------------------------
// Deterministic Price Verification Engine (1-to-1 match with price_verifier.py)
// ---------------------------------------------------------------------------
enum PriceVerdictEnum {
  AUTHENTIC_DEAL = "AUTHENTIC_DEAL",
  NOT_A_DEAL = "NOT_A_DEAL",
  INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE",
  POTENTIAL_PRICE_MANIPULATION = "POTENTIAL_PRICE_MANIPULATION",
}

interface PriceVerificationResult {
  advertised_discount_percent: number | null;
  actual_savings_percent: number | null;
  price_vs_median_percent: number | null;
  price_delta_ratio: number | null;
  verdict: PriceVerdictEnum;
  confidence: number;
  reasoning: string;
  evidence: {
    historical_median_price: number | null;
    historical_average_price: number | null;
    historical_min_price: number | null;
    historical_max_price: number | null;
    observation_count: number;
    first_observed_at: string | null;
    last_observed_at: string | null;
    data_age_days: number | null;
    evidence_confidence: number;
  };
}

function verifyPrice(item: CatalogItem): PriceVerificationResult {
  const minObservations = 5;
  const maxDataAgeDays = 90;
  const fakeDiscountInflationThreshold = 0.25;
  const authenticDealMinSavingsRatio = 0.05;

  const listedPrice = item.listed_price;
  const advertisedMrp = item.advertised_mrp;
  const historicalMedian = item.historical_median_price;
  const observationCount = item.observation_count;
  const lastObservedAt = item.last_observed_at ? new Date(item.last_observed_at) : null;

  // Calculate Data Age
  let dataAgeDays: number | null = null;
  let recencyScore = 0.5;
  if (lastObservedAt) {
    const diffTime = Math.max(0, Date.now() - lastObservedAt.getTime());
    dataAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (dataAgeDays <= 14) recencyScore = 1.0;
    else if (dataAgeDays <= 45) recencyScore = 0.8;
    else if (dataAgeDays <= maxDataAgeDays) recencyScore = 0.5;
    else recencyScore = 0.1;
  }

  // Sample size score
  const sampleScore = Math.min(1.0, Math.log10(observationCount + 1) / Math.log10(31));

  // Stability score
  let stabilityScore = 1.0;
  if (historicalMedian > 0 && item.historical_max_price && item.historical_min_price) {
    const spread = (item.historical_max_price - item.historical_min_price) / historicalMedian;
    if (spread > 1.5) stabilityScore = 0.6;
    else if (spread > 0.8) stabilityScore = 0.85;
  }

  const rawConfidence = 0.5 * sampleScore + 0.35 * recencyScore + 0.15 * stabilityScore;
  const confidence = Math.round(Math.min(1.0, Math.max(0.0, rawConfidence)) * 100) / 100;

  // Advertised discount
  let advertisedDiscountPercent: number | null = null;
  if (advertisedMrp && advertisedMrp > listedPrice) {
    advertisedDiscountPercent = Math.round(((advertisedMrp - listedPrice) / advertisedMrp) * 1000) / 10;
  }

  const evidence = {
    historical_median_price: historicalMedian,
    historical_average_price: item.historical_average_price,
    historical_min_price: item.historical_min_price,
    historical_max_price: item.historical_max_price,
    observation_count: observationCount,
    first_observed_at: item.first_observed_at,
    last_observed_at: item.last_observed_at,
    data_age_days: dataAgeDays,
    evidence_confidence: confidence,
  };

  // Check for insufficient evidence
  const isSparse = observationCount < minObservations;
  const isMissingMedian = !historicalMedian || historicalMedian <= 0;
  const isStale = dataAgeDays !== null && dataAgeDays > maxDataAgeDays;

  if (isSparse || isMissingMedian || isStale) {
    const reasonParts = [];
    if (isSparse) reasonParts.push(`Only ${observationCount} historical price observation(s) available (minimum required: ${minObservations}).`);
    if (isMissingMedian) reasonParts.push("No valid historical median benchmark recorded.");
    if (isStale) reasonParts.push(`Latest price observation is ${dataAgeDays} days old.`);

    return {
      advertised_discount_percent: advertisedDiscountPercent,
      actual_savings_percent: null,
      price_vs_median_percent: null,
      price_delta_ratio: null,
      verdict: PriceVerdictEnum.INSUFFICIENT_EVIDENCE,
      confidence,
      reasoning: `Insufficient pricing evidence: ${reasonParts.join(" ")}`,
      evidence,
    };
  }

  const priceDiffVsMedian = listedPrice - historicalMedian;
  const priceDeltaRatio = priceDiffVsMedian / historicalMedian;
  const priceVsMedianPercent = Math.round(priceDeltaRatio * 10000) / 100;

  const actualSavingsRatio = (historicalMedian - listedPrice) / historicalMedian;
  const actualSavingsPercent = Math.round(actualSavingsRatio * 10000) / 100;

  const isPriceInflated = priceDeltaRatio > fakeDiscountInflationThreshold;
  let isMrpManipulated = false;
  if (advertisedMrp && item.historical_max_price > 0) {
    const mrpInflation = (advertisedMrp - item.historical_max_price) / item.historical_max_price;
    if (mrpInflation > fakeDiscountInflationThreshold) isMrpManipulated = true;
  }

  const isBogusDiscountClaim =
    advertisedDiscountPercent !== null && advertisedDiscountPercent >= 20.0 && listedPrice >= historicalMedian;

  if (isPriceInflated || isMrpManipulated || isBogusDiscountClaim) {
    const details = [];
    if (isPriceInflated) {
      details.push(
        `Current selling price of ₹${listedPrice.toFixed(2)} is ${priceVsMedianPercent}% higher than the historical median (₹${historicalMedian.toFixed(2)}).`
      );
    }
    if (isMrpManipulated) {
      details.push(
        `Advertised MRP (₹${advertisedMrp!.toFixed(2)}) appears artificially elevated above historical max (₹${item.historical_max_price.toFixed(2)}).`
      );
    }
    if (isBogusDiscountClaim && !isPriceInflated) {
      details.push(`Advertised as ${advertisedDiscountPercent}% off, but current price is at or above historical median.`);
    }

    return {
      advertised_discount_percent: advertisedDiscountPercent,
      actual_savings_percent: actualSavingsPercent,
      price_vs_median_percent: priceVsMedianPercent,
      price_delta_ratio: Math.round(priceDeltaRatio * 1000) / 1000,
      verdict: PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION,
      confidence,
      reasoning:
        "The advertised discount is not supported by the available historical price evidence. " + details.join(" "),
      evidence,
    };
  }

  if (actualSavingsRatio >= authenticDealMinSavingsRatio) {
    return {
      advertised_discount_percent: advertisedDiscountPercent,
      actual_savings_percent: actualSavingsPercent,
      price_vs_median_percent: priceVsMedianPercent,
      price_delta_ratio: Math.round(priceDeltaRatio * 1000) / 1000,
      verdict: PriceVerdictEnum.AUTHENTIC_DEAL,
      confidence,
      reasoning: `Authentic price reduction verified: Listed at ₹${listedPrice.toFixed(2)}, representing a genuine ${actualSavingsPercent}% reduction below the 30-day historical median benchmark of ₹${historicalMedian.toFixed(2)}.`,
      evidence,
    };
  }

  return {
    advertised_discount_percent: advertisedDiscountPercent,
    actual_savings_percent: actualSavingsPercent,
    price_vs_median_percent: priceVsMedianPercent,
    price_delta_ratio: Math.round(priceDeltaRatio * 1000) / 1000,
    verdict: PriceVerdictEnum.NOT_A_DEAL,
    confidence,
    reasoning: `Current price of ₹${listedPrice.toFixed(2)} is consistent with its typical historical trading price (median: ₹${historicalMedian.toFixed(2)}). The available evidence does not demonstrate an unusual discount.`,
    evidence,
  };
}

// ---------------------------------------------------------------------------
// AI Normalizer & Stylist Advisor (Gemini 3.8 Flash or deterministic fallback)
// ---------------------------------------------------------------------------
let genaiClient: GoogleGenAI | null = null;
function getGenAI() {
  if (!genaiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      genaiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return genaiClient;
}

interface NormalizedSpec {
  category: string | null;
  style_keywords: string[];
  max_budget: number | null;
  target_vendor: string | null;
  color_preferences: string[];
  material_preferences: string[];
  explicit_features: string[];
}

// ---------------------------------------------------------------------------
// Color Normalization and Matching (Hard Constraint Engine)
// ---------------------------------------------------------------------------

function canonicalizeColor(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const norm = raw.toLowerCase().trim().replace(/[_\s-]+/g, " ");

  if (!norm || norm === "unspecified" || norm === "unknown" || norm === "multi" || norm === "multi color" || norm === "printed") {
    return null;
  }

  // Black family
  if (norm === "black" || norm === "jet black") {
    return "black";
  }

  // Navy family
  if (norm === "navy" || norm === "navy blue" || norm === "navyblue") {
    return "navy";
  }

  // Blue family
  if (norm === "blue" || norm === "lt blue" || norm === "light blue" || norm === "medium blue" || norm === "indigo" || norm === "indigo blue") {
    return "blue";
  }

  // White / Ivory family
  if (norm === "white" || norm === "off white" || norm === "offwhite" || norm === "ivory" || norm === "cream" || norm === "ecru") {
    return "white";
  }

  // Grey / Gray family
  if (norm === "grey" || norm === "gray" || norm === "lt grey" || norm === "light grey" || norm === "charcoal" || norm === "anthra melange") {
    return "grey";
  }

  // Maroon / Burgundy family
  if (norm === "maroon" || norm === "burgundy" || norm === "wine") {
    return "maroon";
  }

  // Red family
  if (norm === "red") {
    return "red";
  }

  // Green family
  if (norm === "green" || norm === "dark green" || norm === "lt green" || norm === "light green" || norm === "mint melange" || norm === "olive" || norm === "olive green" || norm === "emerald" || norm === "emerald green") {
    return "green";
  }

  // Yellow family
  if (norm === "yellow" || norm === "light yellow" || norm === "lt yellow" || norm === "mustard") {
    return "yellow";
  }

  // Pink family
  if (norm === "pink" || norm === "baby pink" || norm === "blush pink" || norm === "lt pink" || norm === "light pink") {
    return "pink";
  }

  // Purple family
  if (norm === "purple" || norm === "lt purple" || norm === "violet" || norm === "lavender" || norm === "plum") {
    return "purple";
  }

  // Peach family
  if (norm === "peach" || norm === "lt peach") {
    return "peach";
  }

  // Orange / Rust family
  if (norm === "orange" || norm === "rust" || norm === "coral") {
    return "orange";
  }

  // Teal / Aqua / Turquoise
  if (norm === "teal" || norm === "aqua" || norm === "turq" || norm === "turquoise" || norm === "teal blue") {
    return "teal";
  }

  // Brown / Beige / Khaki
  if (norm === "brown" || norm === "beige" || norm === "khaki" || norm === "tan") {
    return "brown";
  }

  // Gold
  if (norm === "gold" || norm === "golden") {
    return "gold";
  }

  // Magenta / Fuchsia
  if (norm === "magenta" || norm === "fuchsia" || norm === "magnta fusha") {
    return "magenta";
  }

  return null;
}

/**
 * Extracts and canonicalizes the PRIMARY / DOMINANT color of a catalog item.
 * Deterministic rules based on catalog retail conventions:
 * 1. Multi / printed / unspecified without clear dominant base returns null (excluded from hard color search).
 * 2. Compounds with "with <accent>" (e.g. "red with white flowers") -> primary color is the base garment ("red").
 * 3. Compound delimiters (e.g. "red / white", "red and black", "red, white") -> the first listed color is primary ("red").
 * 4. "print/pattern on <base>" -> the base garment color is primary.
 * 5. Single qualified colors ("navy-blue", "off-white", "jet-black") map to their primary family.
 */
function getPrimaryColor(catalogColor: string | null | undefined): string | null {
  if (!catalogColor || typeof catalogColor !== "string") {
    return null;
  }

  const raw = catalogColor.trim().toLowerCase();
  if (!raw) return null;

  // Multi / unknown without clear dominant color
  if (
    raw === "multi" ||
    raw === "multi color" ||
    raw === "multi-color" ||
    raw === "multicolor" ||
    raw === "multi-colour" ||
    raw === "multicolour" ||
    raw === "printed" ||
    raw === "unspecified" ||
    raw === "unknown"
  ) {
    return null;
  }

  // Handle "on <base>" patterns, e.g. "white flowers on red", "white print on navy"
  const onMatch = raw.match(/\b(?:print|pattern|flowers?|dots?|stripes?)\s+on\s+([a-z-]+)/i);
  if (onMatch && onMatch[1]) {
    const baseColor = canonicalizeColor(onMatch[1]);
    if (baseColor) return baseColor;
  }

  // Handle "with <accent>" patterns, e.g. "red with white flowers", "white with red floral print"
  if (raw.includes(" with ")) {
    let primaryPart = raw.split(" with ")[0].trim();
    primaryPart = primaryPart.replace(/\bbase\b/g, "").trim();
    const canon = canonicalizeColor(primaryPart);
    if (canon) return canon;
  }

  // Handle compound delimiters like "red / white", "red & white", "red and white", "red, white"
  const delimiterMatch = raw.match(/^([a-z\s-]+?)\s*(?:\/|\band\b|&|,)\s*([a-z\s-]+)$/i);
  if (delimiterMatch) {
    const primaryCandidate = delimiterMatch[1].trim();
    const canon = canonicalizeColor(primaryCandidate);
    if (canon) return canon;
  }

  // Check for hyphenated color pairs that are not single qualified colors (e.g. "red-black", "red-white")
  if (raw.includes("-")) {
    const directCanon = canonicalizeColor(raw);
    if (directCanon) return directCanon;

    const parts = raw.split("-");
    if (parts.length === 2) {
      const firstCanon = canonicalizeColor(parts[0].trim());
      const secondCanon = canonicalizeColor(parts[1].trim());
      if (firstCanon && secondCanon) {
        return firstCanon;
      }
    }
  }

  // Clean trailing descriptive words if needed (e.g. "white floral print" -> "white")
  const cleaned = raw.replace(/\b(?:floral|prints?|printed|embellished|pattern|base|accents?)\b/g, "").trim();
  const cleanedCanon = canonicalizeColor(cleaned);
  if (cleanedCanon) return cleanedCanon;

  return canonicalizeColor(raw);
}

interface ColorBearingItem {
  dominant_color?: string | null;
  dominant_color_confidence?: number | null;
  color?: string | null;
}

function matchesRequestedColor(
  itemOrColor: ColorBearingItem | string | null | undefined,
  requestedColors?: string[] | null
): boolean {
  if (!requestedColors || !Array.isArray(requestedColors) || requestedColors.length === 0) {
    return true;
  }

  let dominantColor: string | null = null;
  let hasDominantField = false;
  let catalogColor: string | null = null;

  if (itemOrColor && typeof itemOrColor === "object") {
    if ("dominant_color" in itemOrColor && itemOrColor.dominant_color !== undefined) {
      hasDominantField = true;
      dominantColor = itemOrColor.dominant_color;
    }
    catalogColor = itemOrColor.color ?? null;
  } else if (typeof itemOrColor === "string") {
    catalogColor = itemOrColor;
  }

  // 1. Dominant Color Matching (Visual Ground Truth)
  if (hasDominantField) {
    // If dominant_color is null or unknown for an explicit color query, exclude product
    if (!dominantColor || dominantColor === "null" || dominantColor === "unknown") {
      return false;
    }
    const canon = canonicalizeColor(dominantColor);
    if (!canon) return false;

    for (const req of requestedColors) {
      const reqCanon = canonicalizeColor(req);
      if (!reqCanon) continue;

      if (canon === reqCanon) {
        return true;
      }

      if (reqCanon === "blue" && canon === "navy") {
        return true;
      }
    }
    return false;
  }

  // 2. Fallback: Use getPrimaryColor on catalog color metadata
  if (!catalogColor || typeof catalogColor !== "string") {
    return false;
  }
  const primaryColor = getPrimaryColor(catalogColor);
  if (!primaryColor) {
    return false;
  }

  for (const req of requestedColors) {
    const reqCanon = canonicalizeColor(req);
    if (!reqCanon) continue;

    if (primaryColor === reqCanon) {
      return true;
    }

    if (reqCanon === "blue" && primaryColor === "navy") {
      return true;
    }
  }

  return false;
}

const COLOR_QUERY_PATTERNS = [
  { name: "navy", regex: /\bnavy(?:[- ]?blue)?\b/i },
  { name: "off-white", regex: /\boff[- ]?white\b/i },
  { name: "ivory", regex: /\bivory\b/i },
  { name: "cream", regex: /\bcream\b/i },
  { name: "maroon", regex: /\b(?:maroon|burgundy|wine)\b/i },
  { name: "olive", regex: /\bolive(?:[- ]?green)?\b/i },
  { name: "emerald", regex: /\bemerald(?:[- ]?green)?\b/i },
  { name: "mint", regex: /\bmint(?:[- ]?green)?\b/i },
  { name: "teal", regex: /\b(?:teal|aqua|turquoise)\b/i },
  { name: "peach", regex: /\bpeach\b/i },
  { name: "mustard", regex: /\bmustard\b/i },
  { name: "rust", regex: /\brust\b/i },
  { name: "coral", regex: /\bcoral\b/i },
  { name: "fuchsia", regex: /\b(?:fuchsia|magenta)\b/i },
  { name: "charcoal", regex: /\bcharcoal\b/i },
  // Base colors
  { name: "black", regex: /\b(?:jet[- ]?)?black\b/i },
  { name: "red", regex: /\bred\b/i },
  { name: "blue", regex: /\b(?:light|dark|medium|sky|royal|indigo)?[- ]?blue\b/i },
  { name: "white", regex: /\bwhite\b/i },
  { name: "green", regex: /\b(?:light|dark)?[- ]?green\b/i },
  { name: "yellow", regex: /\byellow\b/i },
  { name: "pink", regex: /\b(?:baby|blush|hot|light)?[- ]?pink\b/i },
  { name: "purple", regex: /\b(?:purple|violet|lavender|plum)\b/i },
  { name: "grey", regex: /\bgr[ea]y\b/i },
  { name: "orange", regex: /\borange\b/i },
  { name: "brown", regex: /\b(?:brown|beige|khaki|tan)\b/i },
  { name: "gold", regex: /\bgold(?:en)?\b/i },
];

// ---------------------------------------------------------------------------
// Category Normalization and Matching (Garment Type Hard Constraint Engine)
// ---------------------------------------------------------------------------

function normalizeCategory(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const lower = raw.toLowerCase().trim();
  if (!lower) return null;

  if (/\b(?:dress|dresses|frock|frocks|gown|gowns|midi)\b/i.test(lower)) {
    return "dress";
  }
  if (/\b(?:kurta|kurtas|kurti|kurtis|anarkali)\b/i.test(lower)) {
    return "kurta";
  }
  if (/\b(?:blouse|blouses)\b/i.test(lower)) {
    return "blouse";
  }
  if (/\b(?:saree|sarees|sari|saris)\b/i.test(lower)) {
    return "saree";
  }
  if (/\b(?:top|tops|shirt|shirts|tee|tees)\b/i.test(lower)) {
    return "top";
  }
  if (/\b(?:jeans|denim|denims|pant|pants|trouser|trousers)\b/i.test(lower)) {
    return "jeans";
  }
  if (/\b(?:sweater|sweaters|cardigan|cardigans|pullover|pullovers)\b/i.test(lower)) {
    return "sweater";
  }

  return null;
}

function parseCategoryFromQuery(query: string): string | null {
  const lower = query.toLowerCase();

  // Deterministic mapping for common user terminology to catalog categories
  // Note: Check "blouse" before "saree" so "saree blouse" resolves to "blouse"
  if (/\b(?:blouse|blouses)\b/i.test(lower)) {
    return "blouse";
  }
  if (/\b(?:dress|dresses|frock|frocks|gown|gowns|midi)\b/i.test(lower)) {
    return "dress";
  }
  if (/\b(?:kurta|kurtas|kurti|kurtis|anarkali)\b/i.test(lower)) {
    return "kurta";
  }
  if (/\b(?:saree|sarees|sari|saris)\b/i.test(lower)) {
    return "saree";
  }
  if (/\b(?:top|tops|shirt|shirts|tee|tees)\b/i.test(lower)) {
    return "top";
  }
  if (/\b(?:jeans|denim|denims|pant|pants|trouser|trousers)\b/i.test(lower)) {
    return "jeans";
  }
  if (/\b(?:sweater|sweaters|cardigan|cardigans|pullover|pullovers)\b/i.test(lower)) {
    return "sweater";
  }

  return null;
}

function matchesRequestedCategory(
  catalogCategory: string | null | undefined,
  requestedCategory: string | null | undefined
): boolean {
  if (!requestedCategory || !requestedCategory.trim()) {
    return true; // No category constraint specified
  }
  if (!catalogCategory || typeof catalogCategory !== "string") {
    return false; // Unknown catalog category cannot satisfy explicit garment constraint
  }

  const reqNorm = normalizeCategory(requestedCategory);
  if (!reqNorm) {
    return true;
  }

  const catNorm = normalizeCategory(catalogCategory);
  if (!catNorm) {
    return false;
  }

  return catNorm === reqNorm;
}

function parseQueryHeuristic(query: string): NormalizedSpec {
  const lower = query.toLowerCase();

  const category = parseCategoryFromQuery(query);

  let max_budget: number | null = null;
  const budgetMatch = lower.match(/(?:under|below|<|<=|budget of|max)\s*₹?\s*(\d+)/i) || lower.match(/₹\s*(\d+)/);
  if (budgetMatch) {
    max_budget = parseFloat(budgetMatch[1]);
  }

  const explicitFeatures: string[] = [];
  const styleKeywords: string[] = [];

  if (lower.includes("pot neck")) {
    explicitFeatures.push("pot neck back design");
    styleKeywords.push("pot neck");
  }
  if (lower.includes("dori") || lower.includes("tie")) {
    explicitFeatures.push("dori ties at the back");
    styleKeywords.push("dori ties");
  }
  if (lower.includes("rhombus") || lower.includes("ruffle")) {
    explicitFeatures.push("rhombus-shaped ruffles");
    styleKeywords.push("rhombus ruffles");
  }
  if (lower.includes("puff sleeve")) {
    explicitFeatures.push("puff sleeves");
    styleKeywords.push("puff sleeves");
  }
  if (lower.includes("mirror work")) {
    explicitFeatures.push("mirror work");
    styleKeywords.push("mirror work");
  }
  if (lower.includes("cutout")) {
    explicitFeatures.push("cutout back");
    styleKeywords.push("cutout back");
  }

  // Extract explicit color keywords
  const colorPreferences: string[] = [];
  for (const { name, regex } of COLOR_QUERY_PATTERNS) {
    if (regex.test(lower)) {
      if (name === "blue" && colorPreferences.includes("navy")) continue;
      if (name === "white" && (colorPreferences.includes("off-white") || colorPreferences.includes("ivory") || colorPreferences.includes("cream"))) continue;
      if (name === "red" && colorPreferences.includes("maroon")) continue;
      if (name === "green" && (colorPreferences.includes("olive") || colorPreferences.includes("emerald") || colorPreferences.includes("mint"))) continue;
      if (!colorPreferences.includes(name)) {
        colorPreferences.push(name);
      }
    }
  }

  return {
    category,
    style_keywords: styleKeywords,
    max_budget,
    target_vendor: null,
    color_preferences: colorPreferences,
    material_preferences: [],
    explicit_features: explicitFeatures,
  };
}

async function normalizeQueryWithAI(query: string): Promise<NormalizedSpec> {
  const heuristic = parseQueryHeuristic(query);
  const client = getGenAI();
  if (!client) {
    return heuristic;
  }

  try {
    const prompt = `You are the Spec Normalizer Agent for VibeCart AI.
Parse this shopping query into JSON:
Query: "${query}"
Return strict JSON adhering to:
{
  "category": string or null (e.g. "dress", "blouse", "anarkali", "top"),
  "style_keywords": list of strings,
  "max_budget": number or null (e.g. 2500),
  "target_vendor": string or null,
  "color_preferences": list of strings,
  "material_preferences": list of strings,
  "explicit_features": list of strings
}`;

    const model = process.env.VIBECART_MODEL || "gemini-2.5-flash";
    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();
    if (text) {
      const parsed: NormalizedSpec = JSON.parse(text);
      if (!Array.isArray(parsed.color_preferences)) {
        parsed.color_preferences = [];
      }
      // Preserve explicit user query colors
      for (const c of heuristic.color_preferences) {
        if (!parsed.color_preferences.includes(c)) {
          parsed.color_preferences.push(c);
        }
      }
      // Preserve explicit user query category or normalize AI category
      if (heuristic.category) {
        parsed.category = heuristic.category;
      } else if (parsed.category) {
        parsed.category = normalizeCategory(parsed.category);
      }
      return parsed;
    }
  } catch (e) {
    console.warn("Gemini normalize failed, falling back to heuristic parser:", e);
  }

  return heuristic;
}

function evaluateVibeScore(
  item: CatalogItem,
  spec: NormalizedSpec
): { vibeScore: number; matched: string[]; missing: string[] } {
  const allText = `${item.title} ${item.description} ${item.style_tags.join(" ")}`.toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  const required = spec.explicit_features.length > 0 ? spec.explicit_features : spec.style_keywords;

  if (required.length === 0) {
    return { vibeScore: 0.85, matched: ["General style alignment"], missing: [] };
  }

  for (const feat of required) {
    const featLower = feat.toLowerCase();
    const tokens = featLower.split(/\s+/).filter((t) => t.length > 2);
    const tokenMatches = tokens.filter((tok) => allText.includes(tok));

    if (tokenMatches.length >= Math.ceil(tokens.length * 0.6)) {
      matched.push(feat);
    } else {
      missing.push(`${feat} (unconfirmed)`);
    }
  }

  const score = matched.length / required.length;
  const vibeScore = Math.max(0.4, Math.round(score * 100) / 100);

  return { vibeScore, matched, missing };
}

// ---------------------------------------------------------------------------
// Multi-Retailer Catalog Adapter Architecture
// ---------------------------------------------------------------------------

enum AdapterStatusEnum {
  SUCCESS = "SUCCESS",
  NOT_CONFIGURED = "NOT_CONFIGURED",
  TIMEOUT = "TIMEOUT",
  RATE_LIMITED = "RATE_LIMITED",
  ERROR = "ERROR",
}

interface RetailerSourceStatus {
  retailer_id: string;
  retailer_name: string;
  status: AdapterStatusEnum;
  latency_ms: number;
  candidate_count: number;
  is_mock_source: boolean;
  message?: string | null;
}

interface PriceObservation {
  canonical_product_id: string;
  retailer_id: string;
  retailer_sku: string;
  observed_price: number;
  advertised_mrp?: number | null;
  observed_at: string;
}

interface RetailerOffer {
  offer_id: string;
  retailer_id: string;
  retailer_name: string;
  retailer_sku: string;
  product_url: string;
  affiliate_url?: string | null;
  listed_price: number;
  advertised_mrp?: number | null;
  currency: string;
  in_stock: boolean;
  vendor_trust_score: number;
  is_mock_data: boolean;
  observed_at: string;
  evidence?: PriceVerificationResult["evidence"] | null;
  has_purchase_link?: boolean;
  competitor_source?: string | null;
}

interface NormalizedProduct {
  canonical_id: string;
  gtin_or_barcode?: string | null;
  manufacturer_style_code?: string | null;
  brand: string;
  title: string;
  description: string;
  category: string;
  color?: string | null;
  dominant_color?: string | null;
  dominant_color_confidence?: number | null;
  material?: string | null;
  style_tags: string[];
  image_urls: string[];
  primary_image_url?: string | null;
  primary_offer: RetailerOffer;
  alternative_offers: RetailerOffer[];
  raw_item: CatalogItem;
}

interface RetailerAdapter {
  retailer_id: string;
  display_name: string;
  is_mock_source: boolean;
  is_configured(): boolean;
  search(spec: NormalizedSpec, limit?: number): Promise<NormalizedProduct[]>;
  checkHealth(): RetailerSourceStatus;
}

// 1. Production Local Catalog Adapter
class LocalCatalogAdapter implements RetailerAdapter {
  retailer_id = "local_csv";
  display_name = "VibeCart Catalog";
  is_mock_source = false;

  is_configured(): boolean {
    return true;
  }

  async search(spec: NormalizedSpec, limit: number = 20): Promise<NormalizedProduct[]> {
    const matched = CATALOG.filter((item) => {
      if (spec.category && spec.category.trim()) {
        if (!matchesRequestedCategory(item.category, spec.category)) return false;
      }
      if (spec.max_budget !== null && spec.max_budget > 0) {
        if (item.listed_price > spec.max_budget) return false;
      }
      if (spec.color_preferences && spec.color_preferences.length > 0) {
        if (!matchesRequestedColor(item, spec.color_preferences)) return false;
      }
      return true;
    }).slice(0, limit);

    return matched.map((item) => {
      const priceResult = verifyPrice(item);
      const isAjio = item.competitor === "Ajio";
      const isTrends = item.competitor === "Ajio-Trends";
      const hasValidLink = Boolean(item.has_purchase_link && (isAjio || isTrends) && item.source_url?.startsWith("http"));
      const retailerDisplayName = isAjio ? "AJIO" : isTrends ? "Trends" : (item.competitor || item.vendor || this.display_name);
      const productUrl = hasValidLink ? item.source_url! : (item.source_url || `/products/${item.product_id}`);

      const offer: RetailerOffer = {
        offer_id: `offer_local_${item.product_id}`,
        retailer_id: this.retailer_id,
        retailer_name: retailerDisplayName,
        retailer_sku: item.product_id,
        product_url: productUrl,
        listed_price: item.listed_price,
        advertised_mrp: item.advertised_mrp,
        currency: "INR",
        in_stock: true,
        vendor_trust_score: item.vendor_trust_score,
        is_mock_data: false,
        observed_at: item.last_observed_at,
        evidence: priceResult.evidence,
        has_purchase_link: hasValidLink,
        competitor_source: item.competitor,
      };

      return {
        canonical_id: item.product_id,
        gtin_or_barcode: null,
        manufacturer_style_code: null,
        brand: item.vendor,
        title: item.title,
        description: item.description,
        category: item.category,
        color: item.color,
        dominant_color: item.dominant_color ?? null,
        dominant_color_confidence: item.dominant_color_confidence ?? null,
        material: item.material,
        style_tags: item.style_tags || [],
        image_urls: [item.image_url],
        primary_image_url: item.image_url,
        primary_offer: offer,
        alternative_offers: [],
        raw_item: item,
      };
    });
  }

  checkHealth(): RetailerSourceStatus {
    return {
      retailer_id: this.retailer_id,
      retailer_name: this.display_name,
      status: AdapterStatusEnum.SUCCESS,
      latency_ms: 1.2,
      candidate_count: CATALOG.length,
      is_mock_source: false,
      message: "Catalog loaded and operational",
    };
  }
}

// 2. Credential-free Mock Adapters for external retailers
class MockRetailerAdapter implements RetailerAdapter {
  retailer_id: string;
  display_name: string;
  is_mock_source = true;
  private _enabled: boolean;
  private _mockInventory: NormalizedProduct[] = [];

  constructor(retailer_id: string, display_name: string, enabled: boolean = false) {
    this.retailer_id = retailer_id;
    this.display_name = display_name;
    this._enabled = enabled;
  }

  is_configured(): boolean {
    return this._enabled;
  }

  enableForTesting(enabled: boolean = true): void {
    this._enabled = enabled;
  }

  addMockProduct(product: NormalizedProduct): void {
    product.primary_offer.is_mock_data = true;
    this._mockInventory.push(product);
  }

  async search(spec: NormalizedSpec, limit: number = 20): Promise<NormalizedProduct[]> {
    if (!this.is_configured()) return [];
    return this._mockInventory
      .filter((p) => {
        if (spec.category && spec.category.trim()) {
          if (!matchesRequestedCategory(p.category, spec.category)) return false;
        }
        if (spec.max_budget !== null && spec.max_budget > 0) {
          if (p.primary_offer.listed_price > spec.max_budget) return false;
        }
        if (spec.color_preferences && spec.color_preferences.length > 0) {
          if (!matchesRequestedColor(p, spec.color_preferences)) return false;
        }
        return true;
      })
      .slice(0, limit);
  }

  checkHealth(): RetailerSourceStatus {
    if (!this.is_configured()) {
      return {
        retailer_id: this.retailer_id,
        retailer_name: this.display_name,
        status: AdapterStatusEnum.NOT_CONFIGURED,
        latency_ms: 0.1,
        candidate_count: 0,
        is_mock_source: true,
        message: "External API integration / credentials not configured.",
      };
    }
    return {
      retailer_id: this.retailer_id,
      retailer_name: this.display_name,
      status: AdapterStatusEnum.SUCCESS,
      latency_ms: 5.0,
      candidate_count: this._mockInventory.length,
      is_mock_source: true,
      message: "Development mock adapter active",
    };
  }
}

// Central Adapter Registry
class AdapterRegistry {
  private _adapters: Map<string, RetailerAdapter> = new Map();

  register(adapter: RetailerAdapter): void {
    this._adapters.set(adapter.retailer_id, adapter);
  }

  unregister(retailer_id: string): boolean {
    return this._adapters.delete(retailer_id);
  }

  get(retailer_id: string): RetailerAdapter | undefined {
    return this._adapters.get(retailer_id);
  }

  listAll(): RetailerAdapter[] {
    return Array.from(this._adapters.values());
  }

  listConfigured(): RetailerAdapter[] {
    return this.listAll().filter((a) => a.is_configured());
  }
}

// Conservative title similarity
function tokenJaccard(t1: string, t2: string): number {
  const stopWords = new Set(["a", "an", "the", "and", "or", "for", "with", "in", "of", "to", "at", "by", "on"]);
  const set1 = new Set(t1.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((s) => s.length > 2 && !stopWords.has(s)));
  const set2 = new Set(t2.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((s) => s.length > 2 && !stopWords.has(s)));
  if (set1.size === 0 || set2.size === 0) return 0;
  let intersect = 0;
  for (const item of set1) {
    if (set2.has(item)) intersect++;
  }
  const union = new Set([...set1, ...set2]).size;
  return union === 0 ? 0 : intersect / union;
}

class MultiSourceAggregator {
  registry: AdapterRegistry;

  constructor(registry?: AdapterRegistry) {
    if (registry) {
      this.registry = registry;
    } else {
      this.registry = new AdapterRegistry();
      this.registry.register(new LocalCatalogAdapter());
      this.registry.register(new MockRetailerAdapter("amazon", "Amazon India", false));
      this.registry.register(new MockRetailerAdapter("flipkart", "Flipkart", false));
      this.registry.register(new MockRetailerAdapter("myntra", "Myntra", false));
      this.registry.register(new MockRetailerAdapter("ajio", "AJIO", false));
    }
  }

  get adapters(): RetailerAdapter[] {
    return this.registry.listAll();
  }

  async searchAll(spec: NormalizedSpec, limitPerSource: number = 20): Promise<{
    products: NormalizedProduct[];
    source_statuses: RetailerSourceStatus[];
    total_candidates_examined: number;
  }> {
    const statuses: RetailerSourceStatus[] = [];
    const allRawItems: NormalizedProduct[] = [];

    await Promise.all(
      this.adapters.map(async (adapter) => {
        const start = Date.now();
        if (!adapter.is_configured()) {
          statuses.push({
            retailer_id: adapter.retailer_id,
            retailer_name: adapter.display_name,
            status: AdapterStatusEnum.NOT_CONFIGURED,
            latency_ms: Date.now() - start,
            candidate_count: 0,
            is_mock_source: adapter.is_mock_source,
            message: "Retailer adapter is not configured or lacks credentials.",
          });
          return;
        }

        try {
          const timeoutPromise = new Promise<NormalizedProduct[]>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 2500)
          );
          const items = await Promise.race([adapter.search(spec, limitPerSource), timeoutPromise]);
          const latency = Date.now() - start;
          statuses.push({
            retailer_id: adapter.retailer_id,
            retailer_name: adapter.display_name,
            status: AdapterStatusEnum.SUCCESS,
            latency_ms: latency,
            candidate_count: items.length,
            is_mock_source: adapter.is_mock_source,
            message: "Successfully queried catalog",
          });
          allRawItems.push(...items);
        } catch (e: any) {
          const latency = Date.now() - start;
          const isTimeout = e.message === "Timeout";
          statuses.push({
            retailer_id: adapter.retailer_id,
            retailer_name: adapter.display_name,
            status: isTimeout ? AdapterStatusEnum.TIMEOUT : AdapterStatusEnum.ERROR,
            latency_ms: latency,
            candidate_count: 0,
            is_mock_source: adapter.is_mock_source,
            message: e.message || "Failed to query retailer",
          });
        }
      })
    );

    // Conservative Deduplication:
    // Priority:
    // Tier 1: GTIN or manufacturer style code match
    // Tier 2: Normalized brand + category + color/material agreement + title token Jaccard similarity >= 0.80
    // Crucial: Price history evidence remains isolated per retailer offer
    const canonicalProducts: NormalizedProduct[] = [];

    for (const item of allRawItems) {
      let matchedCanonical: NormalizedProduct | null = null;
      for (const canonical of canonicalProducts) {
        // Tier 1: Exact Universal Identifiers
        if (
          (item.gtin_or_barcode && canonical.gtin_or_barcode && item.gtin_or_barcode === canonical.gtin_or_barcode) ||
          (item.manufacturer_style_code && canonical.manufacturer_style_code && item.manufacturer_style_code === canonical.manufacturer_style_code)
        ) {
          matchedCanonical = canonical;
          break;
        }

        // Tier 2: Strict Multi-Attribute Match (Never on title alone)
        const b1 = (item.brand || "").toLowerCase().trim();
        const b2 = (canonical.brand || "").toLowerCase().trim();
        if (b1 && b2 && b1 === b2 && b1 !== "generic" && b1 !== "unknown" && b1 !== "vibecart") {
          const c1 = (item.category || "").toLowerCase().trim();
          const c2 = (canonical.category || "").toLowerCase().trim();
          if (c1 === c2) {
            // Color check
            const col1 = (item.color || "").toLowerCase().trim();
            const col2 = (canonical.color || "").toLowerCase().trim();
            const colorMatch = !col1 || !col2 || col1 === col2;

            if (colorMatch) {
              const sim = tokenJaccard(item.title, canonical.title);
              if (sim >= 0.80) {
                matchedCanonical = canonical;
                break;
              }
            }
          }
        }
      }

      if (matchedCanonical) {
        const newOffer = item.primary_offer;
        const existingRetailers = new Set([
          matchedCanonical.primary_offer.retailer_id,
          ...matchedCanonical.alternative_offers.map((o) => o.retailer_id),
        ]);

        if (!existingRetailers.has(newOffer.retailer_id)) {
          if (newOffer.in_stock && newOffer.listed_price < matchedCanonical.primary_offer.listed_price) {
            const oldPrimary = matchedCanonical.primary_offer;
            matchedCanonical.primary_offer = newOffer;
            matchedCanonical.alternative_offers.push(oldPrimary);
          } else {
            matchedCanonical.alternative_offers.push(newOffer);
          }
        }
      } else {
        canonicalProducts.push(item);
      }
    }

    return {
      products: canonicalProducts,
      source_statuses: statuses,
      total_candidates_examined: allRawItems.length,
    };
  }
}

const aggregator = new MultiSourceAggregator();

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

app.get(["/health", "/api/health"], (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "VibeCart AI",
    environment: process.env.NODE_ENV || "development",
    model: "gemini-3.8-flash",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/v1/retailers", (req: Request, res: Response) => {
  const sources = aggregator.adapters.map((a) => a.checkHealth());
  res.json({ count: sources.length, sources });
});

app.get("/api/v1/products", (req: Request, res: Response) => {
  const verifiedProducts = CATALOG.map((item) => {
    const priceResult = verifyPrice(item);
    const isAjio = item.competitor === "Ajio";
    const isTrends = item.competitor === "Ajio-Trends";
    const hasValidLink = Boolean(item.has_purchase_link && (isAjio || isTrends) && item.source_url?.startsWith("http"));
    const retailerDisplayName = isAjio ? "AJIO" : isTrends ? "Trends" : (item.competitor || item.vendor || "Catalog");
    const productUrl = hasValidLink ? item.source_url! : (item.source_url || `/products/${item.product_id}`);

    return {
      product_id: item.product_id,
      vendor: item.vendor,
      title: item.title,
      description: item.description,
      category: item.category,
      color: item.color,
      dominant_color: item.dominant_color ?? null,
      dominant_color_confidence: item.dominant_color_confidence ?? null,
      material: item.material,
      style_tags: item.style_tags || [],
      listed_price: item.listed_price,
      advertised_mrp: item.advertised_mrp,
      advertised_discount_percent: priceResult.advertised_discount_percent,
      historical_median_price: item.historical_median_price,
      actual_savings_percent: priceResult.actual_savings_percent,
      vibe_score: 0.9,
      matched_features: (item.style_tags || []).slice(0, 3),
      missing_features: [],
      price_verdict: priceResult.verdict,
      price_confidence: priceResult.confidence,
      authenticity_reason: priceResult.reasoning,
      final_composite_score: 0.8,
      image_url: item.image_url,
      evidence: priceResult.evidence,
      retailer: retailerDisplayName,
      retailer_display: item.retailer_display,
      competitor: item.competitor,
      has_purchase_link: hasValidLink,
      source_url: item.source_url,
      product_url: productUrl,
      is_mock_offer: false,
    };
  });

  res.json({ count: verifiedProducts.length, products: verifiedProducts });
});

app.get("/api/v1/products/:id", (req: Request, res: Response) => {
  const item = CATALOG.find((p) => p.product_id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const priceResult = verifyPrice(item);
  const isAjio = item.competitor === "Ajio";
  const isTrends = item.competitor === "Ajio-Trends";
  const hasValidLink = Boolean(item.has_purchase_link && (isAjio || isTrends) && item.source_url?.startsWith("http"));
  const retailerDisplayName = isAjio ? "AJIO" : isTrends ? "Trends" : (item.competitor || item.vendor || "Catalog");
  const productUrl = hasValidLink ? item.source_url! : (item.source_url || `/products/${item.product_id}`);

  res.json({
    ...item,
    advertised_discount_percent: priceResult.advertised_discount_percent,
    actual_savings_percent: priceResult.actual_savings_percent,
    price_verdict: priceResult.verdict,
    price_confidence: priceResult.confidence,
    authenticity_reason: priceResult.reasoning,
    evidence: priceResult.evidence,
    retailer: retailerDisplayName,
    retailer_display: item.retailer_display,
    competitor: item.competitor,
    has_purchase_link: hasValidLink,
    source_url: item.source_url,
    product_url: productUrl,
    is_mock_offer: false,
  });
});

app.post("/api/v1/authenticate", async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { query, strict_deal_only = false } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "Query string is required" });
    return;
  }

  // 1. Spec Normalization
  const spec = await normalizeQueryWithAI(query);

  // 2. Multi-Source Aggregator Search & Conservative Deduplication
  const aggregationResult = await aggregator.searchAll(spec, 20);
  let canonicalCandidates = aggregationResult.products;
  const totalExamined = aggregationResult.total_candidates_examined;
  const sourceStatuses = aggregationResult.source_statuses;

  // Filter candidates by hard category constraint before stylist/vibe scoring stage
  if (spec.category && spec.category.trim()) {
    canonicalCandidates = canonicalCandidates.filter((product) =>
      matchesRequestedCategory(product.category || product.raw_item?.category, spec.category)
    );
  }

  // Filter out any candidates not matching requested color before stylist/vibe scoring stage
  if (spec.color_preferences && spec.color_preferences.length > 0) {
    canonicalCandidates = canonicalCandidates.filter((product) =>
      matchesRequestedColor(product, spec.color_preferences)
    );
  }

  // 3. Stylist Advisor Scoring & Price Verification
  const scoredResults = canonicalCandidates.map((product) => {
    const item = product.raw_item;
    const { vibeScore, matched, missing } = evaluateVibeScore(item, spec);
    const priceResult = verifyPrice(item);

    // Deal score mapping
    let dealScore = 0.5;
    if (priceResult.verdict === PriceVerdictEnum.AUTHENTIC_DEAL) {
      dealScore = Math.min(1.0, 0.7 + (priceResult.actual_savings_percent || 10) / 100);
    } else if (priceResult.verdict === PriceVerdictEnum.POTENTIAL_PRICE_MANIPULATION) {
      dealScore = 0.15;
    } else if (priceResult.verdict === PriceVerdictEnum.NOT_A_DEAL) {
      dealScore = 0.4;
    }

    // Composite ranking formula: 0.60 * vibe + 0.30 * deal + 0.10 * confidence
    const finalScore = Math.round((0.6 * vibeScore + 0.3 * dealScore + 0.1 * priceResult.confidence) * 100) / 100;

    return {
      product_id: product.canonical_id,
      vendor: product.brand,
      title: product.title,
      description: product.description,
      category: product.category,
      color: product.color || undefined,
      dominant_color: product.dominant_color ?? item.dominant_color ?? null,
      dominant_color_confidence: product.dominant_color_confidence ?? item.dominant_color_confidence ?? null,
      material: product.material || undefined,
      style_tags: product.style_tags,
      listed_price: product.primary_offer.listed_price,
      advertised_mrp: product.primary_offer.advertised_mrp,
      advertised_discount_percent: priceResult.advertised_discount_percent,
      historical_median_price: item.historical_median_price,
      actual_savings_percent: priceResult.actual_savings_percent,
      vibe_score: vibeScore,
      matched_features: matched,
      missing_features: missing,
      price_verdict: priceResult.verdict,
      price_confidence: priceResult.confidence,
      authenticity_reason: priceResult.reasoning,
      final_composite_score: finalScore,
      image_url: product.primary_image_url || item.image_url,
      evidence: priceResult.evidence,
      retailer: product.primary_offer.retailer_name,
      retailer_display: item.retailer_display,
      competitor: item.competitor,
      has_purchase_link: product.primary_offer.has_purchase_link,
      source_url: item.source_url,
      product_url: product.primary_offer.product_url,
      primary_offer: product.primary_offer,
      alternative_offers: product.alternative_offers,
      is_mock_offer: product.primary_offer.is_mock_data,
    };
  });

  // Filter if strict_deal_only requested
  let filteredResults = scoredResults;
  if (strict_deal_only) {
    filteredResults = filteredResults.filter((r) => r.price_verdict === PriceVerdictEnum.AUTHENTIC_DEAL);
  }

  // Sort by composite ranking descending
  filteredResults.sort((a, b) => b.final_composite_score - a.final_composite_score);

  const durationMs = Date.now() - startTime;

  res.json({
    query,
    normalized_query: spec,
    results: filteredResults.slice(0, 10),
    total_candidates_examined: totalExamined,
    source_statuses: sourceStatuses,
    processing_metadata: {
      correlation_id: `VC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      model_used: "gemini-3.8-flash",
      database_candidates_found: totalExamined,
      llm_candidates_evaluated: canonicalCandidates.length,
      candidates_passing_vibe_threshold: filteredResults.length,
      execution_time_ms: durationMs,
      timestamp: new Date().toISOString(),
    },
  });
});

// Watchlist endpoints
app.post("/api/v1/watchlist", (req: Request, res: Response) => {
  const { user_id, product_id, target_price, notify_on_authentic_deal_only = true } = req.body;
  if (!user_id || !product_id) {
    res.status(400).json({ error: "user_id and product_id are required" });
    return;
  }
  const key = `${user_id}_${product_id}`;
  const entry: WatchlistEntry = {
    user_id,
    product_id,
    target_price: target_price || null,
    notify_on_authentic_deal_only,
    created_at: new Date().toISOString(),
  };
  WATCHLIST_STORE.set(key, entry);
  res.status(201).json({ status: "saved", user_id, product_id, created_at: entry.created_at });
});

app.get("/api/v1/watchlist/:user_id", (req: Request, res: Response) => {
  const userId = req.params.user_id;
  const entries: any[] = [];
  for (const entry of WATCHLIST_STORE.values()) {
    if (entry.user_id === userId) {
      const prod = CATALOG.find((p) => p.product_id === entry.product_id);
      const priceRes = prod ? verifyPrice(prod) : null;
      entries.push({
        ...entry,
        product_title: prod?.title || entry.product_id,
        product_price: prod?.listed_price,
        vendor: prod?.vendor,
        image_url: prod?.image_url,
        price_verdict: priceRes?.verdict,
      });
    }
  }
  res.json({ user_id: userId, count: entries.length, watchlist: entries });
});

app.delete("/api/v1/watchlist/:user_id/:product_id", (req: Request, res: Response) => {
  const key = `${req.params.user_id}_${req.params.product_id}`;
  const deleted = WATCHLIST_STORE.delete(key);
  res.json({ status: deleted ? "deleted" : "not_found" });
});

// Price update event (Pub/Sub simulation)
app.post("/api/v1/events/price-update", (req: Request, res: Response) => {
  const { event_id = `evt-${Date.now()}`, product_id, new_price, advertised_mrp } = req.body;
  const prod = CATALOG.find((p) => p.product_id === product_id);
  if (!prod) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const prevPrice = prod.listed_price;
  prod.listed_price = new_price;
  if (advertised_mrp) prod.advertised_mrp = advertised_mrp;

  const priceResult = verifyPrice(prod);
  const isDeal = priceResult.verdict === PriceVerdictEnum.AUTHENTIC_DEAL;

  let affectedWatchers = 0;
  for (const item of WATCHLIST_STORE.values()) {
    if (item.product_id === product_id) {
      if (!item.notify_on_authentic_deal_only || isDeal) {
        affectedWatchers++;
      }
    }
  }

  res.json({
    event_id,
    product_id,
    previous_price: prevPrice,
    new_price,
    verdict: priceResult.verdict,
    alert_triggered: isDeal,
    affected_watchlists_count: affectedWatchers,
    message: `Price updated from ₹${prevPrice} to ₹${new_price}. Verdict: ${priceResult.verdict}`,
  });
});

// ---------------------------------------------------------------------------
// Vite Integration (Development Middleware & Production Static Serving)
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VibeCart AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
