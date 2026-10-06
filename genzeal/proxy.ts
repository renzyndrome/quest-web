import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

function isProtected(pathname: string): boolean {
  return (
    pathname.endsWith("/edit") ||
    pathname === "/puck" ||
    pathname.startsWith("/puck/") ||
    pathname.startsWith("/api/puck") ||
    pathname.startsWith("/api/upload")
  );
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** HTTP Basic auth: only the password part is checked, the username is ignored. */
function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.EDITOR_PASSWORD;
  if (!expected) return false;
  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("basic ")) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return false;
  const password = decoded.slice(separator + 1);
  // Hashing first gives equal-length buffers, so the comparison leaks no length.
  return timingSafeEqual(digest(password), digest(expected));
}

function unauthorized(): NextResponse {
  return new NextResponse("Sign-in required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="GenZeal editor", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isRead = req.method === "GET" || req.method === "HEAD";

  if (isProtected(pathname)) {
    if (!isAuthorized(req)) return unauthorized();

    if (isRead && pathname.endsWith("/edit")) {
      const url = req.nextUrl.clone();
      const pagePart = pathname.slice(0, -"/edit".length); // "" for "/edit", "/x/y" for "/x/y/edit"
      url.pathname = "/puck" + pagePart;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (isRead && pathname === "/home") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
