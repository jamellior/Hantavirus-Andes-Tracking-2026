import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const FREE_TIER_MAX = 10;
const PREMIUM_MAX = 100;

export async function GET(request: NextRequest) {
  try {
    // 1. Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const title = searchParams.get("title") || null;
    const tags = searchParams.get("tags") || null;
    const dateFrom = searchParams.get("dateFrom") || null;
    const dateTo = searchParams.get("dateTo") || null;

    // 2. Determine if user is premium
    const session = await getServerSession(authOptions);
    let isPremium = false;

    const userId = (session?.user as any)?.id;
    if (userId) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { status: true, currentPeriodEnd: true },
      });

      if (
        subscription &&
        subscription.status === "active" &&
        subscription.currentPeriodEnd &&
        subscription.currentPeriodEnd > new Date()
      ) {
        isPremium = true;
      }
    }

    // 3. Apply tier limits
    const maxLimit = isPremium ? PREMIUM_MAX : FREE_TIER_MAX;
    const limit = Math.min(limitParam, maxLimit);

    // 4. Build where clause
    const where: Record<string, unknown> = { active: true };

    if (title) {
      where.title = { contains: title, mode: "insensitive" };
    }

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }

    if (dateFrom || dateTo) {
      const createdAtFilter: Record<string, Date> = {};
      if (dateFrom) {
        createdAtFilter.gte = new Date(dateFrom);
      }
      if (dateTo) {
        createdAtFilter.lte = new Date(dateTo);
      }
      where.createdAt = createdAtFilter;
    }

    // 5. Query total count and jobs
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where: where as any }),
      prisma.job.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          description: true,
          tags: true,
          sourceUrl: true,
          origin: true,
          createdAt: true,
        },
      }),
    ]);

    // 6. Attach premium indicator to response
    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        isPremium,
        reachedLimit: limit >= FREE_TIER_MAX && !isPremium && total > FREE_TIER_MAX,
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}