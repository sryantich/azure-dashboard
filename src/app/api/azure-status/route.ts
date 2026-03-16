import { NextResponse } from "next/server";

const AZURE_DEVOPS_STATUS_URL = "https://status.dev.azure.com/_apis/status/health";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(AZURE_DEVOPS_STATUS_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "azure-dashboard/1.0",
      },
      next: { revalidate: 30 },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Upstream API error", statusCode: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch Azure status", detail: String(err) },
      { status: 503 }
    );
  }
}
