// The prompt that turns an interior photo into the structured, editable table.
//
// This is an improved version of the original template: it keeps room_style,
// overall_color_palette and an objects[] array, but adds stable ids, bounding
// boxes (so each row can be highlighted on the image), category, finish/texture,
// quantity, lighting and a notes field, and it forbids null values so the table
// never renders blanks.

export const ANALYSIS_PROMPT = `You are an expert interior-design analyst with computer-vision capabilities.

Analyze this interior image and convert ALL visual information into a single,
highly detailed, valid JSON object. Isolate each individual object / interior
design element and, for each one, extract its precise color (descriptive name
AND a best-guess hex code) and its exact material (e.g. "matte leather",
"brushed steel", "oak wood").

Bounding boxes use Gemini's convention: [ymin, xmin, ymax, xmax], where every
value is an integer from 0 to 1000 normalized to the image size (0,0 is the
top-left corner). Give exactly one tight box per object.

Return ONLY a JSON object with EXACTLY this shape (no markdown, no commentary):
{
  "room_type": "string (e.g. living room, bedroom, kitchen)",
  "room_style": "string (e.g. Scandinavian, Industrial, Mid-century)",
  "overall_color_palette": [ { "name": "string", "hex": "#RRGGBB" } ],
  "lighting": { "type": "natural | artificial | mixed", "warmth": "warm | neutral | cool", "description": "string" },
  "objects": [
    {
      "id": "string, unique kebab-case, e.g. sofa-1",
      "name": "string (e.g. 3-seater sofa)",
      "category": "furniture | lighting | decor | textile | flooring | wall | window | plant | other",
      "color": { "name": "string", "hex": "#RRGGBB" },
      "material": "string",
      "finish": "string (e.g. matte, glossy, brushed, woven)",
      "quantity": 1,
      "location": "string (human description, e.g. against the left wall, center)",
      "bounding_box": [ymin, xmin, ymax, xmax],
      "notes": "string ('' if none)"
    }
  ]
}

Rules:
- Identify EVERY distinct, meaningful element: furniture, lighting, rugs,
  curtains/blinds, wall art, mirrors, plants, major decor, plus the floor,
  walls, ceiling and windows.
- Use descriptive color names AND a plausible hex code for every color.
- Never use null. Use "" for unknown strings, 1 for unknown quantity, and your
  single best estimate for every bounding box.
- Make every "id" unique.
- Output ONLY the JSON object.`;
