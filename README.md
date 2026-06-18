# Interior Image Editor

Upload an interior photo → it becomes an **easy-to-understand, editable table**
of every element (color, material, finish, location, bounding box) → edit /
delete / add rows → **regenerate the room** with Google's **Nano Banana Pro**
(`gemini-3-pro-image-preview`) → **compare** the old and new image with a slider
and keep editing.

This is a **100% client-side static site** designed to be hosted on **GitHub
Pages**. There is no server: each user supplies their **own Gemini API key** in
the app, which is stored only in their browser and sent directly to Google.

🔗 Live (after you enable Pages — see below): `https://argaurshar.github.io/image-editor/`

## How it works

1. **Add your key** — click **API key**, paste a Gemini key (from
   [Google AI Studio](https://aistudio.google.com/apikey)). It's saved only in
   your browser's `localStorage`.
2. **Upload** a room image (downscaled in the browser so requests stay small).
3. **Analyze** — the image goes straight from your browser to a Gemini vision
   model (`gemini-2.5-flash`), which returns structured JSON describing the
   scene and every object (with a bounding box each).
4. **Edit the table** — every element is a row you can edit, delete, or add to.
   Click a row (or a box on the image) to highlight it. You can also edit the
   room style, lighting, and palette, and add free-text instructions.
5. **Generate** — your edits are diffed into a precise instruction and sent with
   the photo to **Nano Banana Pro** to produce an edited, photorealistic image.
6. **Compare & iterate** — drag the before/after slider, download the result, or
   hit **Edit more** to re-analyze the new image and keep going.

## Host it on GitHub Pages

The repo includes a workflow (`.github/workflows/deploy.yml`) that builds and
deploys automatically.

1. Merge this branch into **`main`**.
2. In the repo, go to **Settings → Pages → Build and deployment** and set
   **Source: GitHub Actions** (one-time).
3. Every push to `main` now builds the static site and publishes it to
   `https://argaurshar.github.io/image-editor/`.

> The base path is set to `/image-editor` for the build (in the workflow). If you
> rename the repo, update `NEXT_PUBLIC_BASE_PATH` in the workflow to match.

## Run it locally

Requirements: Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
npm run dev       # http://localhost:3000  (base path is empty locally)
```

Then click **API key** in the app and paste your Gemini key.

To preview the exact static build:

```bash
npm run build     # outputs to ./out
npx serve out     # or any static file server
```

## Security

- **No secret key lives in this repo.** Each user enters their own key at
  runtime; it is kept in `localStorage` only and sent directly to Google.
- Because the call is made from the browser, treat the key as visible to the
  person using the app. Recommended hardening in Google Cloud Console: restrict
  the key to the **Generative Language API**, and optionally to your Pages
  domain via an **HTTP referrer** restriction.
- Image generation with Nano Banana Pro is a **paid** feature, so the key needs
  a project with billing enabled.

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

- **Next.js (App Router, static export)** + React + TypeScript
- **Tailwind CSS**
- **`@google/genai`** SDK, called directly from the browser

## Project structure

```
app/
  page.tsx              # main flow: key → upload → edit → compare
  layout.tsx
components/             # uploader, image canvas, table, scene panel, slider, key dialog…
lib/
  gemini.ts             # client-side Gemini calls + JSON normalization
  useApiKey.ts          # localStorage key management
  prompts.ts            # the analysis prompt (improved template)
  diff.ts               # table edits -> edit instruction
  image.ts              # client-side resize + data-url helpers
  types.ts              # shared types
.github/workflows/
  deploy.yml            # build + deploy to GitHub Pages
```
