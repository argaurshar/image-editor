"use client";

import { useMemo, useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageCanvas } from "@/components/ImageCanvas";
import { ElementsTable } from "@/components/ElementsTable";
import { ScenePanel } from "@/components/ScenePanel";
import { CompareSlider } from "@/components/CompareSlider";
import { Spinner } from "@/components/Spinner";
import { Stepper, type StepKey } from "@/components/Stepper";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { analyzeImage, generateImage } from "@/lib/gemini";
import { buildEditPlan } from "@/lib/diff";
import { splitDataUrl } from "@/lib/image";
import { useApiKey } from "@/lib/useApiKey";
import type { EditorImage, RoomAnalysis } from "@/lib/types";

type Stage = "upload" | "editing" | "result";

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export default function Home() {
  const { apiKey, setApiKey, clearKey, loaded } = useApiKey();
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const [stage, setStage] = useState<Stage>("upload");
  const [baseImage, setBaseImage] = useState<EditorImage | null>(null);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [baseline, setBaseline] = useState<RoomAnalysis | null>(null);
  const [generated, setGenerated] = useState<EditorImage | null>(null);
  const [lastInstruction, setLastInstruction] = useState<string>("");
  const [extra, setExtra] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAllBoxes, setShowAllBoxes] = useState(true);
  const [loading, setLoading] = useState<null | "analyze" | "generate">(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stepKey: StepKey =
    stage === "upload" ? "upload" : stage === "editing" ? "edit" : "result";

  const plan = useMemo(
    () =>
      baseline && analysis ? buildEditPlan(baseline, analysis, extra) : null,
    [baseline, analysis, extra]
  );

  function requireKey(): boolean {
    if (!apiKey) {
      setError("Add your Gemini API key first.");
      setShowKeyDialog(true);
      return false;
    }
    return true;
  }

  async function analyze(image: EditorImage) {
    if (!requireKey()) return;
    setError(null);
    setLoading("analyze");
    try {
      const { base64, mimeType } = splitDataUrl(image.dataUrl);
      const result = await analyzeImage(apiKey, base64, mimeType);
      setAnalysis(result);
      setBaseline(clone(result));
      setExtra("");
      setSelectedId(null);
      setStage("editing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(null);
    }
  }

  function handleImage(image: EditorImage) {
    setBaseImage(image);
    setGenerated(null);
    analyze(image);
  }

  async function generate() {
    if (!baseImage || !plan) return;
    if (!requireKey()) return;
    if (!plan.hasChanges) {
      setError("Edit the table or add an instruction before generating.");
      return;
    }
    setError(null);
    setLoading("generate");
    try {
      const { base64, mimeType } = splitDataUrl(baseImage.dataUrl);
      const image = await generateImage(apiKey, base64, mimeType, plan.instruction);
      setGenerated(image);
      setLastInstruction(plan.instruction);
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(null);
    }
  }

  function editMore() {
    if (!generated) return;
    setBaseImage(generated);
    setGenerated(null);
    analyze(generated);
  }

  function startOver() {
    setStage("upload");
    setBaseImage(null);
    setAnalysis(null);
    setBaseline(null);
    setGenerated(null);
    setExtra("");
    setSelectedId(null);
    setError(null);
  }

  function copyJson() {
    if (!analysis) return;
    navigator.clipboard?.writeText(JSON.stringify(analysis, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interior Image Editor
          </h1>
          <p className="text-sm text-slate-500">
            Photo → editable table → AI-regenerated room, powered by Nano Banana
            Pro.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Stepper active={stepKey} />
          <button
            onClick={() => setShowKeyDialog(true)}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            title="Set your Gemini API key"
          >
            <span
              className={[
                "inline-block h-2 w-2 rounded-full",
                loaded && apiKey ? "bg-emerald-500" : "bg-amber-400",
              ].join(" ")}
            />
            {loaded && apiKey ? "API key ✓" : "Add API key"}
          </button>
          {stage !== "upload" && (
            <button
              onClick={startOver}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      {loaded && !apiKey && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            Add your own Gemini API key to start. It stays in your browser only.
          </span>
          <button
            onClick={() => setShowKeyDialog(true)}
            className="shrink-0 rounded-md bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600"
          >
            Add key
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-medium">
            ✕
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {stage === "upload" && (
        <div className="mx-auto max-w-2xl py-10">
          {loading === "analyze" ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Spinner label="Analyzing the room and building the table…" />
            </div>
          ) : (
            <ImageUploader onImage={handleImage} />
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {stage === "editing" && baseImage && analysis && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  {analysis.room_style ? `${analysis.room_style} ` : ""}
                  {analysis.room_type}
                </span>
                <label className="flex items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={showAllBoxes}
                    onChange={(e) => setShowAllBoxes(e.target.checked)}
                  />
                  Show all boxes
                </label>
              </div>
              <div className="flex justify-center">
                <ImageCanvas
                  image={baseImage}
                  objects={analysis.objects}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  showAllBoxes={showAllBoxes}
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                Click a box or a table row to highlight an element.
              </p>
            </div>
            <ScenePanel analysis={analysis} onChange={setAnalysis} />
          </div>

          <div className="space-y-4">
            <ElementsTable
              analysis={analysis}
              onChange={setAnalysis}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Extra instructions (optional)
              </label>
              <textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                rows={2}
                placeholder="e.g. make the room feel brighter and add a large window"
                className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {plan?.hasChanges
                    ? `${plan.changes.length} pending change${plan.changes.length === 1 ? "" : "s"}`
                    : "No changes yet — edit the table to begin"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyJson}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    {copied ? "Copied!" : "Copy JSON"}
                  </button>
                  <button
                    onClick={generate}
                    disabled={loading === "generate" || !plan?.hasChanges}
                    className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading === "generate" ? "Generating…" : "Generate image"}
                  </button>
                </div>
              </div>

              {loading === "generate" && (
                <div className="mt-3">
                  <Spinner label="Nano Banana Pro is editing your room…" />
                </div>
              )}

              {plan && plan.changes.length > 0 && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-slate-600">
                    Preview the edit instruction
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                    {plan.changes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {stage === "result" && baseImage && generated && (
        <div className="mx-auto max-w-4xl space-y-5">
          <CompareSlider before={baseImage} after={generated} />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={editMore}
              className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              ✎ Edit more
            </button>
            <a
              href={generated.dataUrl}
              download={`edited-room.${generated.mimeType.includes("png") ? "png" : "jpg"}`}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ⬇ Download
            </a>
            <button
              onClick={startOver}
              className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Start over
            </button>
          </div>

          {lastInstruction && (
            <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <summary className="cursor-pointer font-medium text-slate-700">
                What we asked the model to change
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                {lastInstruction}
              </pre>
            </details>
          )}
        </div>
      )}

      {showKeyDialog && (
        <ApiKeyDialog
          initialKey={apiKey}
          onSave={setApiKey}
          onClear={clearKey}
          onClose={() => setShowKeyDialog(false)}
        />
      )}
    </main>
  );
}
