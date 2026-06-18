// Shared types for the room analysis "table" and the image editing flow.

/** A bounding box in Gemini's convention: [ymin, xmin, ymax, xmax], 0-1000. */
export type BoundingBox = [number, number, number, number];

export interface ColorInfo {
  name: string;
  hex: string;
}

export interface Lighting {
  /** natural | artificial | mixed */
  type: string;
  /** warm | neutral | cool */
  warmth: string;
  description: string;
}

export interface RoomObject {
  /** Stable, unique id (kebab-case), e.g. "sofa-1". */
  id: string;
  name: string;
  /** furniture | lighting | decor | textile | flooring | wall | window | plant | other */
  category: string;
  color: ColorInfo;
  material: string;
  /** matte | glossy | brushed | woven | etc. */
  finish: string;
  quantity: number;
  /** Human-readable location, e.g. "against the left wall, center". */
  location: string;
  bounding_box: BoundingBox;
  notes: string;
}

export interface RoomAnalysis {
  room_type: string;
  room_style: string;
  overall_color_palette: ColorInfo[];
  lighting: Lighting;
  objects: RoomObject[];
}

/** An image held in the browser / passed to the API. */
export interface EditorImage {
  /** Full data URL, e.g. "data:image/jpeg;base64,...." */
  dataUrl: string;
  mimeType: string;
}

export interface AnalyzeResponse {
  analysis: RoomAnalysis;
}

export interface GenerateResponse {
  image: EditorImage;
  /** The instruction that was sent to the image model (for transparency). */
  instruction: string;
}

export interface ApiError {
  error: string;
}
