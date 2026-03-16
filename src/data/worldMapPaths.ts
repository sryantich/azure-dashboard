/**
 * Generates SVG path strings from real Natural Earth TopoJSON data
 * (world-atlas 110m resolution) using an equirectangular (Plate Carrée) projection.
 *
 * We convert TopoJSON → GeoJSON features, then project each polygon
 * to SVG path `d` strings for a given viewBox.
 */

import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";

/* ── Projection parameters ── */
const MAP_W = 1000;
const MAP_H = 500;
const PAD_X = 20;
const PAD_Y = 10;

/**
 * Equirectangular projection: lng/lat → SVG x/y.
 * Crops to roughly lat ∈ [-60, 84] to avoid extreme polar distortion.
 */
const LAT_MIN = -60;
const LAT_MAX = 84;

function projectX(lng: number): number {
  return PAD_X + ((lng + 180) / 360) * (MAP_W - PAD_X * 2);
}

function projectY(lat: number): number {
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  return (
    PAD_Y +
    ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * (MAP_H - PAD_Y * 2)
  );
}

/** Convert a GeoJSON ring (array of [lng, lat]) to an SVG sub-path string. */
function ringToPath(ring: number[][]): string {
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [lng, lat] = ring[i];
    const x = projectX(lng);
    const y = projectY(lat);
    d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d + "Z";
}

/** Convert a GeoJSON geometry to an SVG path `d` string. */
function geometryToPath(geometry: GeoJSON.Geometry): string {
  if (geometry.type === "Polygon") {
    return geometry.coordinates.map(ringToPath).join(" ");
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates
      .map((polygon) => polygon.map(ringToPath).join(" "))
      .join(" ");
  }
  return "";
}

export interface CountryPath {
  id: string;
  path: string;
}

let _cache: { countries: CountryPath[]; land: string } | null = null;

/**
 * Returns pre-computed SVG paths for all countries and a combined land outline.
 * Cached after first call.
 */
export function getWorldPaths(): { countries: CountryPath[]; land: string } {
  if (_cache) return _cache;

  const topo = worldData as unknown as Topology<{
    countries: GeometryCollection;
    land: GeometryCollection;
  }>;

  // Convert countries TopoJSON → GeoJSON feature collection
  const countriesGeo = topojson.feature(topo, topo.objects.countries);

  const countries: CountryPath[] = [];

  if (countriesGeo.type === "FeatureCollection") {
    for (const feature of countriesGeo.features) {
      const path = geometryToPath(feature.geometry);
      if (path) {
        const props = feature.properties as Record<string, unknown> | null;
        countries.push({
          id: String(feature.id ?? props?.name ?? ""),
          path,
        });
      }
    }
  }

  // Convert land outline (merged) → single path for border rendering
  const landGeo = topojson.feature(topo, topo.objects.land) as
    | GeoJSON.FeatureCollection
    | GeoJSON.Feature;
  let land = "";
  if (landGeo.type === "FeatureCollection") {
    land = landGeo.features.map((f) => geometryToPath(f.geometry)).join(" ");
  } else if (landGeo.type === "Feature") {
    land = geometryToPath(landGeo.geometry);
  }

  _cache = { countries, land };
  return _cache;
}

/** Reusable projection function for lat/lng → SVG coordinates */
export function project(
  lat: number,
  lng: number
): { x: number; y: number } {
  return { x: projectX(lng), y: projectY(lat) };
}

export { MAP_W, MAP_H };
