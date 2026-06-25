import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/admin/clean — Forces cleaning of broken links (admin only)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Try to call the scraper's cleanJobs
    let removed = 0;
    try {
      const scraper = (await import("@/lib/scraper/scraper")) as any;
      if (typeof scraper.cleanJobs === "function") {
        removed = await scraper.cleanJobs();
      } else {
        // Fallback: mark old jobs as inactive
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const result = await prisma.job.updateMany({
          where: { createdAt: { lt: thirtyDaysAgo }, active: true },
          data: { active: false },
        });
        removed = result.count;
      }
    } catch {
      // Scraper module not available — fallback
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = await prisma.job.updateMany({
        where: { createdAt: { lt: thirtyDaysAgo }, active: true },
        data: { active: false },
      });
      removed = result.count;
    }

    return NextResponse.json({ removed, success: true });
  } catch (error) {
    console.error("Clean error:", error);
    return NextResponse.json({ error: "Cleaning failed" }, { status: 500 });
  }
}