// =====================================================
// Canvas Playground — Clean build (drag + resize + persist(desktop) + mobile-random + pan + zoom/pinch + hover-bounce)
// =====================================================

// ---------- Config ----------
const IMAGE_COUNT = 23;
const IS_MOBILE = window.matchMedia('(max-width: 640px)').matches;
const PERSIST_KEY = 'hello-layout-v3';      // desktop only
const PERSIST_ON_MOBILE = false;             // keep mobile "random every load"
const WHEEL_ZOOM_STEP = 0.001;               // desktop wheel zoom speed
const SCALE_MIN = 0.3, SCALE_MAX = 3;

// Desktop default layout (fixed)
const desktopLayout = {
  "frame-1":  { "x": 646.51,  "y": -281.271, "w": 300 },
  "frame-2":  { "x": 75.6457, "y": -184.501, "w": 300 },
  "frame-3":  { "x": 1222.89, "y": 128.086,  "w": 300 },
  "frame-4":  { "x": 1630.49, "y": 102.215,  "w": 256.25 },
  "frame-5":  { "x": 1358.34, "y": -205.033, "w": 272.28 },
  "frame-6":  { "x": 122.905, "y": 401.245,  "w": 300 },
  "frame-7":  { "x": -477.218,"y": -38.3265, "w": 237.677 },
  "frame-8":  { "x": 937.073, "y": 299.138,  "w": 300 },
  "frame-9":  { "x": 130.481, "y": 65.5438,  "w": 300 },
  "frame-10": { "x": -317.917,"y": 195.851,  "w": 300 },
  "frame-11": { "x": -183.49, "y": 642.815,  "w": 300 },
  "frame-12": { "x": -624.919,"y": -366.449, "w": 300 },
  "frame-13": { "x": -692.494,"y": 152.045,  "w": 341.243 },
  "frame-14": { "x": -224.904,"y": -286.979, "w": 300 },
  "frame-15": { "x": 1705.41, "y": -221.885, "w": 300 },
  "frame-16": { "x": -677.793,"y": 481.315,  "w": 300 },
  "frame-17": { "x": 1546.96, "y": 442.999,  "w": 300 },
  "frame-18": { "x": 1438.88, "y": 757.966,  "w": 300 },
  "frame-19": { "x": 456.796, "y": 615.772,  "w": 422.33 },
  "frame-20": { "x": 1068.47, "y": 641.17,   "w": 300 },
  "frame-21": { "x": 962.906, "y": -127.276, "w": 300 },
  "frame-22": { "x": 476.185, "y": 106.032,  "w": 413.955 },
  "frame-23": { "x": -579.162,"y": 699.192,  "w": 300 }
};

// ---------- Mobile random layout (every load) ----------
function computeMobileLayoutRandom() {
  const ids = Array.from({ length: IMAGE_COUNT }, (_, i) => `frame-${i + 1}`);
  const baseWMin = 210, baseWMax = 300;
  const minDist = 250, tries = 600;
  const R_x = 750, R_y = 950;

  const placed = [], layout = {};
  function rand() { return Math.random(); }
  function randomInEllipse() {
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    return { x: Math.cos(theta) * R_x * r, y: Math.sin(theta) * R_y * r };
  }
  function farEnough(x, y) {
    for (const p of placed) if (Math.hypot(x - p.x, y - p.y) < minDist) return false;
    return true;
  }

  ids.forEach(id => {
    const w = ba
