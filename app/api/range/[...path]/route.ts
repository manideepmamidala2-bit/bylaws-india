import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, If-None-Match, Content-Type",
  "Access-Control-Expose-Headers":
    "Content-Range, Content-Length, Accept-Ranges, ETag",
  "Accept-Ranges": "bytes",
};

function getPublicRoot(): string {
  const pubFolder = process.env.BYLAWS_PUBLIC_DIR || ["pub", "lic"].join("");
  return path.resolve(process.cwd(), pubFolder);
}

function resolveSafePublicPath(segments: string[]): string | null {
  const publicRoot = getPublicRoot();
  const candidate = path.resolve(publicRoot, ...segments);
  if (
    candidate !== publicRoot &&
    !candidate.startsWith(publicRoot + path.sep)
  ) {
    return null;
  }
  return candidate;
}

function guessContentType(filePath: string): string {
  if (filePath.endsWith(".pmtiles")) return "application/vnd.pmtiles";
  if (filePath.endsWith(".geojson")) return "application/geo+json";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "application/octet-stream";
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const diskPath = resolveSafePublicPath(segments);
  if (!diskPath) {
    return new NextResponse("Forbidden", { status: 403, headers: CORS_HEADERS });
  }

  let resolvedPath = diskPath;
  let stat: Awaited<ReturnType<typeof fs.stat>> | null = null;
  try {
    const s = await fs.stat(resolvedPath);
    if (s.isFile()) stat = s;
  } catch {
    stat = null;
  }

  // Fallback for shared basemap.pmtiles across child/parent jurisdictions
  if (!stat && resolvedPath.endsWith(`${path.sep}basemap.pmtiles`)) {
    const dataDir = path.join(getPublicRoot(), "data");
    try {
      const entries = await fs.readdir(dataDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const cand = path.join(dataDir, entry.name, "basemap.pmtiles");
        try {
          const cs = await fs.stat(cand);
          if (cs.isFile()) {
            resolvedPath = cand;
            stat = cs;
            break;
          }
        } catch {
          // continue searching
        }
      }
    } catch {
      // ignore
    }
  }

  if (!stat) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: CORS_HEADERS,
    });
  }

  const fileSize = stat.size;
  const contentType = guessContentType(resolvedPath);
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const match = /^bytes=(\d+)-(\d*)$/i.exec(rangeHeader.trim());
    if (!match) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...CORS_HEADERS,
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }
    const start = Number.parseInt(match[1], 10);
    const end = match[2]
      ? Math.min(Number.parseInt(match[2], 10), fileSize - 1)
      : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize || end < start) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          ...CORS_HEADERS,
          "Content-Range": `bytes */${fileSize}`,
        },
      });
    }

    const length = end - start + 1;
    const handle = await fs.open(resolvedPath, "r");
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, start);
      const slice = bytesRead === length ? buffer : buffer.subarray(0, bytesRead);
      return new NextResponse(new Uint8Array(slice), {
        status: 206,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${start + slice.length - 1}/${fileSize}`,
          "Content-Length": String(slice.length),
        },
      });
    } finally {
      await handle.close();
    }
  }

  const fullBuffer = await fs.readFile(resolvedPath);
  return new NextResponse(new Uint8Array(fullBuffer), {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(fullBuffer.length),
    },
  });
}
