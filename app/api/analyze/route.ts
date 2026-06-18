import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const base64: string | undefined = body?.imageBase64;
    const mimeType: string = body?.mimeType || "image/jpeg";
    if (!base64) {
      return NextResponse.json({ error: "Missing image data." }, { status: 400 });
    }
    const analysis = await analyzeImage(base64, mimeType);
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
