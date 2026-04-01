/**
 * Vietnamese + English Keyword Extractor for drone R&D domain
 * Extracts keywords, component names, and phase terms from issue text
 */

// ─── Vietnamese Stopwords ────────────────────────────────────────────
const VI_STOPWORDS = new Set([
  "của",
  "là",
  "và",
  "trong",
  "các",
  "những",
  "được",
  "có",
  "cho",
  "với",
  "này",
  "đã",
  "không",
  "một",
  "về",
  "từ",
  "theo",
  "đến",
  "khi",
  "để",
  "do",
  "bị",
  "tại",
  "vì",
  "nên",
  "sẽ",
  "hay",
  "hoặc",
  "cũng",
  "đang",
  "phải",
  "như",
  "thì",
  "mà",
  "đó",
  "nếu",
  "còn",
  "lại",
  "ra",
  "vào",
  "lên",
  "xuống",
  "cần",
  "nào",
  "đều",
  "rất",
  "thêm",
  "qua",
  "sau",
  "trước",
  "trên",
  "dưới",
  "giữa",
  "bên",
  "ngoài",
  "mỗi",
  "vẫn",
  "chỉ",
  "rồi",
  "hơn",
  "bao",
  "nhiều",
  "ít",
  "nhất",
  "đây",
  "kia",
  "ấy",
  "thế",
  "vậy",
  "bởi",
  "chưa",
  "gì",
  "ai",
  "đâu",
  "sao",
  "tuy",
  "nhưng",
  "song",
]);

const EN_STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "can",
  "shall",
  "to",
  "of",
  "in",
  "for",
  "on",
  "with",
  "at",
  "by",
  "from",
  "as",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "out",
  "off",
  "over",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "when",
  "where",
  "why",
  "how",
  "all",
  "both",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "and",
  "but",
  "or",
  "if",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "he",
  "him",
  "his",
  "she",
  "her",
  "they",
  "them",
  "their",
]);

// ─── Domain Entity Dictionary ────────────────────────────────────────

/** Component names commonly found in drone R&D */
const COMPONENT_DICTIONARY = new Set([
  // Propulsion
  "motor",
  "esc",
  "propeller",
  "prop",
  "bldc",
  "brushless",
  // Electronics
  "pcb",
  "mcu",
  "fc",
  "flight controller",
  "pdb",
  "power board",
  "receiver",
  "rx",
  "transmitter",
  "tx",
  "vtx",
  "osd",
  // Navigation
  "gps",
  "gnss",
  "compass",
  "magnetometer",
  "barometer",
  "baro",
  "imu",
  "accelerometer",
  "gyroscope",
  "gyro",
  "lidar",
  "sonar",
  // Camera / Gimbal
  "camera",
  "gimbal",
  "lens",
  "sensor",
  "cmos",
  "fpv camera",
  "stabilizer",
  "servo",
  "pan",
  "tilt",
  "roll",
  // Frame
  "frame",
  "arm",
  "landing gear",
  "canopy",
  "shell",
  "body",
  "carbon fiber",
  "cf",
  "mount",
  "damper",
  "vibration",
  // Power
  "battery",
  "lipo",
  "charger",
  "bms",
  "voltage regulator",
  "power module",
  "connector",
  "wire",
  "harness",
  // Communication
  "antenna",
  "radio",
  "telemetry",
  "datalink",
  "rc link",
  "wifi",
  "bluetooth",
  "lte",
  "4g",
  "5g",
  // Software
  "firmware",
  "software",
  "driver",
  "protocol",
  "pid",
  "kalman",
  "filter",
  "algorithm",
  "calibration",
]);

/** Project names in RtR system */
const PROJECT_DICTIONARY = new Set([
  "hera",
  "dualsight",
  "dual sight",
  "fpv",
  "omnisight",
  "omni sight",
  "skyline",
  "phoenix",
  "titan",
  "raptor",
  "hawk",
  "eagle",
]);

/** Phase terms */
const PHASE_DICTIONARY = new Set([
  // Vietnamese phases
  "thiết kế",
  "chế tạo",
  "thử nghiệm",
  "sản xuất",
  "nghiệm thu",
  "lắp ráp",
  "kiểm tra",
  "bay thử",
  "đánh giá",
  // English phases
  "design",
  "prototype",
  "prototyping",
  "testing",
  "test",
  "production",
  "manufacturing",
  "assembly",
  "integration",
  "validation",
  "verification",
  "review",
  "certification",
  "r&d",
  "research",
  "development",
  "procurement",
  "sourcing",
]);

// ─── Extraction ──────────────────────────────────────────────────────

export interface KeywordResult {
  keywords: string[];
  components: string[];
  phases: string[];
}

/**
 * Tokenize text: lowercase, split on non-alphanumeric (preserving Vietnamese characters),
 * remove stopwords, filter short tokens
 */
function tokenize(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase().normalize("NFC");
  // Split on whitespace, punctuation, special chars
  const tokens = normalized.split(/[\s,.:;!?/\\()\[\]{}<>""''`~@#$%^&*+=|_\-–—]+/);
  return tokens.filter((t) => t.length >= 2 && !VI_STOPWORDS.has(t) && !EN_STOPWORDS.has(t) && !/^\d+$/.test(t));
}

/**
 * Check if a text contains a multi-word term (case insensitive)
 */
function containsTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term);
}

/**
 * Extract keywords, components, and phases from title + description
 */
export function extractKeywords(title: string, description?: string): KeywordResult {
  const fullText = [title, description].filter(Boolean).join(" ");
  const tokens = tokenize(fullText);

  // Deduplicate keywords
  const keywordSet = new Set(tokens);

  // Match components (single-word from tokens + multi-word from full text)
  const components = new Set<string>();
  for (const token of keywordSet) {
    if (COMPONENT_DICTIONARY.has(token)) {
      components.add(token);
    }
  }
  // Check multi-word component terms
  for (const term of COMPONENT_DICTIONARY) {
    if (term.includes(" ") && containsTerm(fullText, term)) {
      components.add(term);
    }
  }

  // Match phases
  const phases = new Set<string>();
  for (const token of keywordSet) {
    if (PHASE_DICTIONARY.has(token)) {
      phases.add(token);
    }
  }
  for (const term of PHASE_DICTIONARY) {
    if (term.includes(" ") && containsTerm(fullText, term)) {
      phases.add(term);
    }
  }

  // Match projects
  for (const term of PROJECT_DICTIONARY) {
    if (containsTerm(fullText, term)) {
      keywordSet.add(term);
    }
  }

  return {
    keywords: Array.from(keywordSet),
    components: Array.from(components),
    phases: Array.from(phases),
  };
}
