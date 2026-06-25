import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as any;
        const userId = checkoutSession.metadata?.userId;
        const customerId = checkoutSession.customer;
        const subscriptionId = checkoutSession.subscription;

        if (!userId) {
          console.error("No userId in checkout session metadata");
          break;
        }

        // Retrieve subscription details
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          const subData = subscription as any;
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripePriceId: subData.items.data[0]?.price.id,
              status: subData.status,
              currentPeriodEnd: new Date(
                subData.current_period_end * 1000
              ),
            },
            update: {
              stripeCustomerId: customerId,
              stripePriceId: subData.items.data[0]?.price.id,
              status: subData.status,
              currentPeriodEnd: new Date(
                subData.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          // Find the user by customer ID
          const customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;

          if (customerId) {
            const subRecord = await prisma.subscription.findFirst({
              where: { stripeCustomerId: customerId },
            });

            if (subRecord) {
              const subData = subscription as any;
              await prisma.subscription.update({
                where: { id: subRecord.id },
                data: {
                  status: subData.status,
                  currentPeriodEnd: new Date(
                    subData.current_period_end * 1000
                  ),
                },
              });
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as any;
        const customerId = deletedSub.customer;

        if (customerId) {
          const subRecord = await prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (subRecord) {
            await prisma.subscription.update({
              where: { id: subRecord.id },
              data: {
                status: "canceled",
                currentPeriodEnd: new Date(
                  deletedSub.current_period_end * 1000
                ),
              },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const updatedSub = event.data.object as any;
        const custId = updatedSub.customer;

        if (custId) {
          const subRecord = await prisma.subscription.findFirst({
            where: { stripeCustomerId: custId },
          });

          if (subRecord) {
            await prisma.subscription.update({
              where: { id: subRecord.id },
              data: {
                status: updatedSub.status,
                currentPeriodEnd: new Date(
                  updatedSub.current_period_end * 1000
                ),
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}