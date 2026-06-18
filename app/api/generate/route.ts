import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const base64: string | undefined = body?.imageBase64;
    const mimeType: string = body?.mimeType || "image/jpeg";
    const instruction: string = (body?.instruction || "").trim();

    if (!base64) {
      return NextResponse.json({ error: "Missing image data." }, { status: 400 });
    }
    if (!instruction) {
      return NextResponse.json(
        { error: "Missing edit instruction." },
        { status: 400 }
      );
    }

    const result = await generateImage(base64, mimeType, instruction);
    return NextResponse.json({
      image: {
        dataUrl: `data:${result.mimeType};base64,${result.data}`,
        mimeType: result.mimeType,
      },
      instruction,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
