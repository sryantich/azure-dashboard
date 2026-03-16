import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://status.azure.com/en-us/status/feed/", {
      headers: { Accept: "application/rss+xml, application/xml, text/xml" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ incidents: [], rssAvailable: false });
    }

    const xml = await res.text();

    // Parse RSS items from XML
    const items: {
      title: string;
      description: string;
      pubDate: string;
      link: string;
    }[] = [];

    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
      const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim() ?? "";
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? "";
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? "";

      if (title) {
        items.push({ title, description, pubDate, link });
      }
    }

    // Convert RSS items to incident format
    const incidents = items.map((item, i) => {
      const isCritical = /outage|down|unavail/i.test(item.title);
      const isWarning = /degrad|issue|delay|error|fail/i.test(item.title);
      const isResolved = /resolved|mitigated|recovered/i.test(item.title);

      return {
        id: `rss-${i}`,
        title: item.title.replace(/<[^>]+>/g, ""),
        description: item.description.replace(/<[^>]+>/g, "").slice(0, 300),
        status: isResolved ? "resolved" : "active",
        severity: isCritical ? "critical" : isWarning ? "warning" : "info",
        impactedServices: [],
        startTime: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        lastUpdate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      incidents,
      rssAvailable: true,
      itemCount: items.length,
    });
  } catch {
    return NextResponse.json({ incidents: [], rssAvailable: false });
  }
}
