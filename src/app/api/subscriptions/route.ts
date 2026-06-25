import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

// GET /api/subscriptions - Get current user's subscription status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ subscription: null });
    }

    const userId = (session.user as any).id;
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        status: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
      },
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/subscriptions - Cancel current user's subscription
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    // Find active Stripe subscriptions for this customer
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: subscription.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (stripeSubscriptions.data.length > 0) {
      // Cancel at period end
      await stripe.subscriptions.update(
        stripeSubscriptions.data[0].id,
        {
          cancel_at_period_end: true,
        }
      );
    }

    await prisma.subscription.update({
      where: { userId },
      data: { status: "canceled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}