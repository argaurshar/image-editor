# Interior Image Editor

Upload an interior photo → it becomes an **easy-to-understand, editable table**
of every element (color, material, finish, location, bounding box) → edit /
delete / add rows → **regenerate the room** with Google's **Nano Banana Pro**
(`gemini-3-pro-image-preview`) → **compare** the old and new image with a slider
and keep editing.

## How it works

1. **Upload** a room image (drag & drop or browse). It's downscaled in the
   browser so requests stay small.
2. **Analyze** — the image is sent to a Gemini vision model
   (`gemini-2.5-flash` by default) with a structured prompt that returns a JSON
   description of the scene and every object, including a bounding box for each.
3. **Edit the table** — every element is a row you can edit, delete, or add to.
   Click a row (or a box on the image) to highlight it. You can also edit the
   room style, lighting, and color palette, and add free-text instructions.
4. **Generate** — your edits are diffed against the original analysis to build a
   precise natural-language instruction, which is sent with the original photo to
   **Nano Banana Pro** to produce an edited, photorealistic image.
5. **Compare & iterate** — drag the before/after slider, download the result, or
   hit **Edit more** to re-analyze the new image and keep going.

## Setup

Requirements: Node.js 18.18+ (Node 20+ recommended).

```bash
npm install

# Configure your key
cp .env.example .env.local
# then edit .env.local and set GEMINI_API_KEY=...

npm run dev
# open http://localhost:3000
```

Get a key from **Google AI Studio → API keys**: https://aistudio.google.com/apikey

> **Note:** image generation with Nano Banana Pro is a paid feature, so the key
> must be on a project with billing enabled.

### Environment variables

| Variable         | Required | Default                       | Purpose                                  |
| ---------------- | -------- | ----------------------------- | ---------------------------------------- |
| `GEMINI_API_KEY` | yes      | —                             | Your Google Gemini API key (server-side) |
| `ANALYZE_MODEL`  | no       | `gemini-2.5-flash`            | Vision model for image → JSON            |
| `IMAGE_MODEL`    | no       | `gemini-3-pro-image-preview`  | "Nano Banana Pro" image edit model       |

## Security

- The API key is read **only on the server** (in `/app/api/*` routes via
  `process.env`) and is never shipped to the browser.
- `.env.local` and `.env` are git-ignored — **never commit your key**.
- If a key is ever exposed (e.g. pasted into chat or a screenshot), **rotate it**
  in Google AI Studio.

## The JSON template

This project uses an improved version of the original analysis prompt. In
addition to `room_style`, `overall_color_palette`, and an `objects` array of
`name` / `color` / `material` / location, it adds:

- a stable, unique `id` per object (so edits can be diffed reliably),
- a `bounding_box` (`[ymin, xmin, ymax, xmax]`, normalized 0–1000) so each row
  highlights on the image,
- `category`, `finish`, and `quantity` per object,
- `room_type` and a structured `lighting` block,
- a "never use null" rule so the table never renders blanks.

The full prompt lives in [`lib/prompts.ts`](lib/prompts.ts).

## Tech stack

- **Next.js (App Router)** + React + TypeScript
- **Tailwind CSS**
- **`@google/genai`** SDK for the Gemini API

## Project structure

```
app/
  page.tsx              # main flow: upload → edit → compare
  layout.tsx
  api/
    analyze/route.ts    # image -> structured JSON (server)
    generate/route.ts   # image + instruction -> new image (server)
components/             # uploader, image canvas, table, scene panel, slider…
lib/
  gemini.ts             # server-only Gemini calls + JSON normalization
  prompts.ts            # the analysis prompt (improved template)
  diff.ts               # table edits -> edit instruction
  image.ts              # client-side resize + data-url helpers
  types.ts              # shared types
```
