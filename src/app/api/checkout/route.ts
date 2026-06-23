import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/?error=auth_required", "http://localhost:3000")
      );
    }

    const userId = (session.user as any).id;
    const userEmail = session.user.email || undefined;

    // Check if user already has an active subscription
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (
      existingSub?.stripeCustomerId &&
      existingSub.status === "active" &&
      existingSub.currentPeriodEnd &&
      existingSub.currentPeriodEnd > new Date()
    ) {
      // Already premium - send to billing portal
      return NextResponse.redirect(
        new URL("/pricing?status=already_premium", "http://localhost:3000")
      );
    }

    // Create or retrieve Stripe customer
    let customerId = existingSub?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;

      // Save customer ID
      if (existingSub) {
        await prisma.subscription.update({
          where: { userId },
          data: { stripeCustomerId: customer.id },
        });
      }
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "RemoteRadar Premium",
              description: "Acceso ilimitado a todas las vacantes 100% remotas",
            },
            unit_amount: 299, // $2.99
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing?canceled=true`,
      metadata: { userId },
    });

    if (!checkoutSession.url) {
      throw new Error("No checkout URL returned");
    }

    return NextResponse.redirect(checkoutSession.url);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.redirect(
      new URL("/pricing?error=checkout_failed", "http://localhost:3000")
    );
  }
}