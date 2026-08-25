import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface MediaItem {
  url: string;
  quality?: string;
  extension?: string;
  type?: string;
}

interface RapidApiResponse {
  medias?: MediaItem[];
  url?: string;
  title?: string;
  [key: string]: unknown;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.url !== "string" || body.url.trim().length === 0) {
      return NextResponse.json(
        { status: "error", message: "A valid 'url' field is required." },
        { status: 400 }
      );
    }

    const targetUrl = body.url.trim();

    if (!isValidUrl(targetUrl)) {
      return NextResponse.json(
        { status: "error", message: "The provided URL is not a valid http/https link." },
        { status: 400 }
      );
    }

    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      return NextResponse.json(
        { status: "error", message: "Server is missing RAPIDAPI_KEY. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const rapidApiHost = "social-download-all-in-one.p.rapidapi.com";

    const apiResponse = await fetch(`https://${rapidApiHost}/v1/social/autolink`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": rapidApiHost,
      },
      body: JSON.stringify({ url: targetUrl }),
    });

    if (!apiResponse.ok) {
      const text = await apiResponse.text().catch(() => "");
      return NextResponse.json(
        { status: "error", message: `Extraction service returned an error (${apiResponse.status}). ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data: RapidApiResponse = await apiResponse.json();

    // TEMPORARY DEBUG LINE — remove once we've seen the real shape

    const medias = Array.isArray(data.medias) ? data.medias : [];

    if (medias.length === 0 && !data.url) {
      return NextResponse.json(
        { status: "error", message: "No downloadable media was found for this URL." },
        { status: 404 }
      );
    }

    const hd = medias.find((m) => (m.quality || "").toLowerCase().includes("hd"));
    const sd = medias.find((m) => (m.quality || "").toLowerCase().includes("sd"));
    const best = hd || sd || medias[0];
    const downloadUrl = best?.url || data.url || "";

    if (!downloadUrl) {
      return NextResponse.json(
        { status: "error", message: "Could not resolve a direct download link." },
        { status: 404 }
      );
    }

    const picker = medias.length > 1 ? medias : null;

    return NextResponse.json({ status: "success", downloadUrl, picker });
  } catch (error) {
    console.error("Download route error:", error);
    return NextResponse.json(
      { status: "error", message: "Unexpected server error while processing the request." },
      { status: 500 }
    );
  }
}