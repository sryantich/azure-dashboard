import { NextRequest, NextResponse } from "next/server";
import { getAzureCredential, touchConnection } from "@/lib/azure";

/**
 * GET /api/azure/metrics?resourceId=...&metricNames=...&timespan=...&interval=...
 *
 * Queries Azure Monitor metrics for a specific resource.
 * - resourceId: full ARM resource ID (required)
 * - metricNames: comma-separated metric names (e.g. "Percentage CPU,Network In Total")
 * - timespan: ISO 8601 duration or start/end (default: PT1H)
 * - interval: aggregation interval (default: PT5M)
 * - aggregation: Average, Total, Count, Minimum, Maximum (default: Average)
 */
export async function GET(req: NextRequest) {
  const azure = await getAzureCredential();
  if (!azure) {
    return NextResponse.json(
      { error: "No verified Azure connection." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  const metricNames = searchParams.get("metricNames") || "Percentage CPU";
  const timespan = searchParams.get("timespan") || "PT1H";
  const interval = searchParams.get("interval") || "PT5M";
  const aggregation = searchParams.get("aggregation") || "Average";

  if (!resourceId) {
    return NextResponse.json(
      { error: "resourceId query parameter is required." },
      { status: 400 }
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

    // Azure Monitor Metrics REST API
    const metricsUrl = new URL(
      `https://management.azure.com${resourceId}/providers/Microsoft.Insights/metrics`
    );
    metricsUrl.searchParams.set("api-version", "2023-10-01");
    metricsUrl.searchParams.set("metricnames", metricNames);
    metricsUrl.searchParams.set("timespan", timespan);
    metricsUrl.searchParams.set("interval", interval);
    metricsUrl.searchParams.set("aggregation", aggregation);

    const res = await fetch(metricsUrl.toString(), {
      headers: { Authorization: `Bearer ${token.token}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Monitor API error: ${res.status} — ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Transform into a simpler shape
    const metrics = (data.value || []).map(
      (metric: {
        name: { value: string; localizedValue: string };
        unit: string;
        timeseries: {
          data: {
            timeStamp: string;
            average?: number;
            total?: number;
            count?: number;
            minimum?: number;
            maximum?: number;
          }[];
        }[];
      }) => ({
        name: metric.name.localizedValue || metric.name.value,
        unit: metric.unit,
        dataPoints: (metric.timeseries?.[0]?.data || []).map((dp) => ({
          timestamp: dp.timeStamp,
          value:
            dp.average ?? dp.total ?? dp.count ?? dp.minimum ?? dp.maximum ?? 0,
        })),
      })
    );

    await touchConnection(azure.connectionId);

    return NextResponse.json({ metrics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
