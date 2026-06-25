import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// POST /api/admin/scrape — Forces manual scraping (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Try to call the scraper's extractAndSave
    let extracted = 0;
    try {
      const scraper = await import("@/lib/scraper/scraper") as any;
      if (typeof scraper.extractAndSave === "function") {
        extracted = await scraper.extractAndSave();
      }
    } catch {
      // Scraper module not available yet — return placeholder
      console.log("Scraper module not available, returning placeholder");
    }

    return NextResponse.json({ extracted, success: true });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
  }
}