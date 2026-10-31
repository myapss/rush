import { NextResponse, type NextRequest } from "next/server";
import { isUnknownContentPath } from "@/lib/known-paths";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  if (isUnknownContentPath(request.nextUrl.pathname)) {
    // Render the not-found page with a real 404 status.
    return NextResponse.rewrite(new URL("/_not-found-content", request.url), { status: 404 });
  }
  return updateSession(request);
}

export const config = {
  // Skip static assets and image files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
