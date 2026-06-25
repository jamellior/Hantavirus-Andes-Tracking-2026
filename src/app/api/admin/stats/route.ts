import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/stats — Returns dashboard stats (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const [
      activeJobs,
      totalUsers,
      premiumUsers,
      recentJobs,
      scraperCronLog,
    ] = await Promise.all([
      prisma.job.count({ where: { active: true } }),
      prisma.user.count(),
      prisma.subscription.count({
        where: {
          status: "active",
          currentPeriodEnd: { gt: new Date() },
        },
      }),
      prisma.job.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          company: true,
          origin: true,
          createdAt: true,
          active: true,
        },
      }),
      prisma.job.findFirst({
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

    return NextResponse.json({
      activeJobs,
      totalUsers,
      premiumUsers,
      recentJobs,
      lastScraperRun: scraperCronLog?.updatedAt || null,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}