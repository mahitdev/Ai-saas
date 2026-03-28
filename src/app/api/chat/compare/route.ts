import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { getAuthenticatedUser, unauthorized } from "@/lib/server/session";

const compareSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
  leftModel: z.enum(["auto", "chatgpt", "gemini"]),
  rightModel: z.enum(["auto", "chatgpt", "gemini"]),
  imageDataUrl: z.string().max(3_000_000).optional(),
});

function parseImageDataUrl(imageDataUrl?: string) {
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) return null;
  const [meta, data] = imageDataUrl.split(",", 2);
  if (!meta || !data) return null;
  const mimeType = meta.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/)?.[1];
  if (!mimeType) return null;
  return { mimeType, base64Data: data };
}

async function askGemini(prompt: string, imageDataUrl?: string) {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) return "GEMINI_API_KEY is missing.";
  const parsedImage = parseImageDataUrl(imageDataUrl);

  const models = ["models/gemini-2.5-flash", "models/gemini-2.0-flash", "models/gemini-1.5-flash-latest"];
  for (const model of models) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: "You are concise and practical. Answer clearly." },
                { text: prompt },
                ...(parsedImage
                  ? [
                      {
                        inline_data: {
                          mime_type: parsedImage.mimeType,
                          data: parsedImage.base64Data,
                        },
                      },
                    ]
                  : []),
              ],
            },
          ],
        }),
      },
    );
    if (!response.ok) continue;
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text =
      payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text?.trim() ?? "";
    if (text) return text;
  }

  return "Gemini could not produce a response right now.";
}

async function askOpenAi(prompt: string, imageDataUrl?: string) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) return "OPENAI_API_KEY is missing.";

  const models = ["gpt-4.1-mini", "gpt-4o-mini"];
  for (const model of models) {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: "You are concise and practical. Answer clearly." },
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...(imageDataUrl ? [{ type: "input_image", image_url: imageDataUrl }] : []),
            ],
          },
        ],
      }),
    });
    if (!response.ok) continue;

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    const directText = payload.output_text?.trim();
    if (directText) return directText;
    const nested =
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => item.type === "output_text" && item.text?.trim())?.text
        ?.trim() ?? "";
    if (nested) return nested;
  }

  return "ChatGPT could not produce a response right now.";
}

async function askModel(model: "auto" | "chatgpt" | "gemini", prompt: string, imageDataUrl?: string) {
  if (model === "chatgpt") return askOpenAi(prompt, imageDataUrl);
  if (model === "gemini") return askGemini(prompt, imageDataUrl);

  const openAi = await askOpenAi(prompt, imageDataUrl);
  if (!openAi.toLowerCase().includes("could not produce") && !openAi.toLowerCase().includes("missing")) {
    return openAi;
  }
  return askGemini(prompt, imageDataUrl);
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = compareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comparison payload" }, { status: 400 });
  }

  const [leftResult, rightResult] = await Promise.all([
    askModel(parsed.data.leftModel, parsed.data.prompt, parsed.data.imageDataUrl),
    askModel(parsed.data.rightModel, parsed.data.prompt, parsed.data.imageDataUrl),
  ]);

  return NextResponse.json({
    leftResult,
    rightResult,
  });
}

