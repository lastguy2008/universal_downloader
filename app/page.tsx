"use client";

import { useState, FormEvent } from "react";
import { Download, Loader2, Link2, AlertCircle, CheckCircle2, PlayCircle } from "lucide-react";

interface MediaItem {
  url: string;
  quality?: string;
  extension?: string;
  type?: string;
}

interface ApiSuccess {
  status: "success";
  downloadUrl: string;
  picker: MediaItem[] | null;
}

interface ApiError {
  status: "error";
  message: string;
}

type ApiResponse = ApiSuccess | ApiError;

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSuccess | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = url.trim();

    if (!trimmed) {
      setError("Please paste a video URL first.");
      return;
    }

    if (!isValidHttpUrl(trimmed)) {
      setError("That doesn't look like a valid URL. Include https:// and try again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || data.status === "error") {
        setError(
          data.status === "error" ? data.message : "Something went wrong. Please try again."
        );
        return;
      }

      setResult(data);
    } catch {
      setError("Network error — could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-16">
        {/* Heading */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-4 py-1.5 text-xs font-medium tracking-wide text-slate-300 backdrop-blur-sm">
            <PlayCircle className="h-3.5 w-3.5 text-indigo-400" />
            Universal Media Downloader
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Download any video,
            <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}instantly.
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Paste a link from your favorite platform and get a direct, high-quality
            download link in seconds.
          </p>
        </div>

        {/* Glassmorphism card */}
        <div className="w-full rounded-2xl border border-slate-700/50 bg-slate-900/40 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label htmlFor="url" className="text-sm font-medium text-slate-300">
              Video URL
            </label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500" />
              <input
                id="url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/watch?v=..."
                disabled={loading}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:from-indigo-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching download link...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Get Download Link
                </>
              )}
            </button>
          </form>

          {/* Error banner */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result card */}
          {result && (
            <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Link ready
              </div>

              <a
                href={result.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                <Download className="h-4 w-4" />
                Download File
              </a>

              {result.picker && result.picker.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Other qualities
                  </p>
                  <div className="flex flex-col gap-2">
                    {result.picker.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 transition hover:border-indigo-500/50 hover:text-white"
                      >
                        <span>
                          {item.quality || item.type || `Option ${idx + 1}`}
                          {item.extension ? ` · .${item.extension}` : ""}
                        </span>
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          For personal use only. Please respect copyright and each platform&apos;s terms of service.
        </p>
      </div>
    </main>
  );
}
