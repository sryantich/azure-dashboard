import { NextResponse } from "next/server";
import { getAzureCredential, touchConnection } from "@/lib/azure";

/**
 * GET /api/azure/resources
 * Lists resources in the user's Azure subscription using ARM REST API.
 * Returns a summary: total count, counts by type, and resource list.
 */
export async function GET() {
  const azure = await getAzureCredential();
  if (!azure) {
    return NextResponse.json(
      { error: "No verified Azure connection. Add one in Settings." },
      { status: 403 }
    );
  }

  try {
    // Get a token for ARM
    const token = await azure.credential.getToken(
      "https://management.azure.com/.default"
    );

    if (!token) {
      return NextResponse.json(
        { error: "Failed to obtain Azure access token." },
        { status: 500 }
      );
    }

    // List all resources in the subscription
    const res = await fetch(
      `https://management.azure.com/subscriptions/${azure.subscriptionId}/resources?api-version=2021-04-01&$top=200`,
      {
        headers: { Authorization: `Bearer ${token.token}` },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `ARM API error: ${res.status} — ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const resources = (data.value || []) as {
      id: string;
      name: string;
      type: string;
      location: string;
      tags?: Record<string, string>;
    }[];

    // Summarize by type
    const byType: Record<string, number> = {};
    for (const r of resources) {
      const shortType = r.type.split("/").slice(-1)[0] || r.type;
      byType[shortType] = (byType[shortType] || 0) + 1;
    }

    // Summarize by location
    const byLocation: Record<string, number> = {};
    for (const r of resources) {
      byLocation[r.location] = (byLocation[r.location] || 0) + 1;
    }

    await touchConnection(azure.connectionId);

    return NextResponse.json({
      subscriptionId: azure.subscriptionId,
      totalCount: resources.length,
      byType,
      byLocation,
      resources: resources.slice(0, 100).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        location: r.location,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
