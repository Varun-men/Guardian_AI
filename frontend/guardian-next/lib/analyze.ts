
import type { AnalyzeResponse } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type ImageMetadata = {
  filename: string;
  alt?: string | null;
};

export async function analyzeDraft(
  content: string,
  images: ImageMetadata[]
): Promise<AnalyzeResponse> {
  const response = await fetch(
    `${API_BASE}/api/review/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        has_image: images.length > 0,
        images,
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ?? `Analysis failed (${response.status})`
    );
  }

  return data as AnalyzeResponse;
}
