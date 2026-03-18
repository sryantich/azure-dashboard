import { NextResponse } from "next/server";
import { getAzureCredential, touchConnection } from "@/lib/azure";

/**
 * GET /api/azure/health
 * Fetches resource health availability statuses from Azure Resource Health API.
 * Returns a summary of resource health states.
 */
export async function GET() {
  const azure = await getAzureCredential();
  if (!azure) {
    return NextResponse.json(
      { error: "No verified Azure connection." },
      { status: 403 }
    );
  }

  try {
    const token = await azure.credential.getToken(
      "https://management.azure.com/.default"
    );

    if (!token) {
      return NextResponse.json(
        { error: "Failed to obtain Azure access token." },
        { status: 500 }
      );
    }

    // Azure Resource Health — availability statuses for the subscription
    const healthUrl = `https://management.azure.com/subscriptions/${azure.subscriptionId}/providers/Microsoft.ResourceHealth/availabilityStatuses?api-version=2023-10-01-preview&$top=100`;

    const res = await fetch(healthUrl, {
      headers: { Authorization: `Bearer ${token.token}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Resource Health API error: ${res.status} — ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const statuses = (data.value || []) as {
      id: string;
      name: string;
      properties: {
        availabilityState: string;
        title?: string;
        summary?: string;
        reasonType?: string;
        occuredTime?: string;
        reportedTime?: string;
      };
    }[];

    // Summarize
    const summary: Record<string, number> = {};
    const resources = statuses.map((s) => {
      const state = s.properties.availabilityState || "Unknown";
      summary[state] = (summary[state] || 0) + 1;

      // Extract resource name from the ID
      const parts = s.id.split("/");
      const resourceName =
        parts[parts.length - 3] || parts[parts.length - 1] || "Unknown";
      const resourceType = parts.slice(-4, -2).join("/") || "Unknown";

      return {
        id: s.id,
        name: resourceName,
        type: resourceType,
        state,
        title: s.properties.title,
        summary: s.properties.summary,
        reportedTime: s.properties.reportedTime,
      };
    });

    await touchConnection(azure.connectionId);

    return NextResponse.json({
      totalCount: statuses.length,
      summary,
      resources: resources.slice(0, 50),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
