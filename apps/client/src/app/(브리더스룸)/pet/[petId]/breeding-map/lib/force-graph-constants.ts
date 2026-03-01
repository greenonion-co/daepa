// --- 노드 크기 ---
export const MIN_RADIUS = 20;
export const MAX_RADIUS = 40;
export const BASE_FONT_SIZE = 10;
export const PAIR_RADIUS_BOOST = 8;

// --- 색상 ---
export const COLOR_DEFAULT_NODE = "#5a6a7a";
export const COLOR_DEFAULT_EDGE = "#d1d5db";
export const COLOR_HOVER_NODE = "#22d3ee";
export const COLOR_HOVER_CENTER = "#fbbf24";
export const COLOR_HOVER_EDGE = "#22d3ee";
export const COLOR_FADED = "#e5e7eb";
export const COLOR_FADED_DARK = "#374151";
export const COLOR_SELECTED_RING = "#3b82f6";

export const COLOR_PAIR_EDGE = "#c084fc"; // purple-400
export const COLOR_PAIR_EDGE_DARK = "#a78bfa"; // violet-400
export const COLOR_HOVER_PAIR_EDGE = "#e879f9"; // fuchsia-400
export const COLOR_PARENT_EDGE = "#f97316"; // orange-500
export const COLOR_CHILD_HIGHLIGHT = "#22d3ee"; // cyan-400
export const COLOR_SIBLING = "#f43f5e"; // rose-500

export const COLOR_DEFAULT_EDGE_DARK = "#4b5563"; // gray-600
export const COLOR_FADED_EDGE = "#f3f4f6"; // gray-100
export const COLOR_FADED_EDGE_DARK = "#1f2937"; // gray-800

// --- 인터랙션 ---
export const DBLCLICK_DELAY = 250;

// --- Force simulation ---
export const SIM_LINK_DISTANCE = 180;
export const SIM_CHARGE_STRENGTH = -600;
export const SIM_AXIS_STRENGTH = 0.06;
export const SIM_COLLIDE_PADDING = 20;
export const SIM_ALPHA_DECAY = 0.02;
export const SIM_ALPHA_EXPANSION = 0.3;
export const SIM_ALPHA_INITIAL = 0.8;
export const SIM_DRAG_ALPHA_TARGET = 0.3;

export const PAIR_ALIGN_STRENGTH = 0.6;
export const GENERATION_GAP = 200;
export const GENERATION_Y_STRENGTH = 0.3;

// --- 포커스 애니메이션 ---
export const FOCUS_MIN_ZOOM = 1.8;
export const FOCUS_TRANSITION_MS = 700;
export const FOCUS_HIGHLIGHT_MS = 2000;
export const FOCUS_RETRY_TIMEOUT = 2000;
export const FOCUS_RETRY_INTERVAL = 100;

// --- 화살표 마커 정의 ---
export const ARROW_MARKER_DEFS: [string, string, number, number][] = [
  ["arrowhead", COLOR_DEFAULT_EDGE, 8, 6],
  ["arrowhead-dark", COLOR_DEFAULT_EDGE_DARK, 8, 6],
  ["arrowhead-hover", COLOR_HOVER_EDGE, 14, 10],
  ["arrowhead-parent", COLOR_PARENT_EDGE, 14, 10],
  ["arrowhead-child-hl", COLOR_CHILD_HIGHLIGHT, 14, 10],
  ["arrowhead-selected", COLOR_SELECTED_RING, 14, 10],
  ["arrowhead-faded-light", COLOR_FADED_EDGE, 6, 4],
  ["arrowhead-faded-dark", COLOR_FADED_EDGE_DARK, 6, 4],
];
