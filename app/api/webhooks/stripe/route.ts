import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { subscriptions, payments, type Subscription } from "@/db/schema";
import { eq } from "drizzle-orm";

type SubscriptionStatus = Subscription["status"];

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Mapeo de price_id a plan_name
const PRICE_TO_PLAN_MAP: Record<string, "Basic" | "Professional" | "Enterprise"> = {
  // Basic
  "price_1SUE86RvHgVvyOnzMC39XU4e": "Basic", // Monthly
  "price_1SUEFHRvHgVvyOnz57Z9527l": "Basic", // Yearly

  // Professional
  "price_1SUE9URvHgVvyOnzk8Bi433c": "Professional", // Monthly
  "price_1SUEH0RvHgVvyOnzawrqMP5i": "Professional", // Yearly

  // Enterprise
  "price_1SUEArRvHgVvyOnz6XX65K22": "Enterprise", // Monthly
  "price_1SUEHtRvHgVvyOnzdiAelIy8": "Enterprise", // Yearly
};

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature found" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  console.log("Received webhook event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extraer metadata del usuario
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error("No userId in session metadata");
          return NextResponse.json({ error: "No userId" }, { status: 400 });
        }

        // Si es una subscription
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          // Obtener la subscription completa de Stripe
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );

          const priceId = stripeSubscription.items.data[0]?.price.id;
          const planName = priceId ? PRICE_TO_PLAN_MAP[priceId] : undefined;

          // Crear o actualizar la subscription en la BD
          const existingSubscription = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

          if (existingSubscription.length > 0) {
            // Actualizar subscription existente
            await db
              .update(subscriptions)
              .set({
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                planName: planName || "Free",
                status: stripeSubscription.status as SubscriptionStatus,
                currentPeriodStart: new Date(
                  stripeSubscription.current_period_start * 1000
                ),
                currentPeriodEnd: new Date(
                  stripeSubscription.current_period_end * 1000
                ),
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.userId, userId));
          } else {
            // Crear nueva subscription
            await db.insert(subscriptions).values({
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              planName: planName || "Free",
              status: stripeSubscription.status as SubscriptionStatus,
              currentPeriodStart: new Date(
                stripeSubscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                stripeSubscription.current_period_end * 1000
              ),
              cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
            });
          }

          // Registrar el pago
          await db.insert(payments).values({
            userId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            amount: session.amount_total || 0,
            currency: session.currency || "mxn",
            status: "succeeded",
            planName: planName,
            metadata: JSON.stringify({
              subscriptionId,
              priceId,
              customerEmail: session.customer_email,
            }),
          });

          console.log(
            `✅ Subscription created/updated for user ${userId}, plan: ${planName}`
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Buscar subscription por stripe_subscription_id
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
          .limit(1);

        if (existingSubscription.length > 0) {
          const priceId = subscription.items.data[0]?.price.id;
          const planName = priceId ? PRICE_TO_PLAN_MAP[priceId] : undefined;

          await db
            .update(subscriptions)
            .set({
              status: subscription.status as SubscriptionStatus,
              currentPeriodStart: new Date(
                subscription.current_period_start * 1000
              ),
              currentPeriodEnd: new Date(
                subscription.current_period_end * 1000
              ),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              stripePriceId: priceId,
              planName: planName || existingSubscription[0].planName,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

          console.log(`✅ Subscription updated: ${subscription.id}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Actualizar status a canceled
        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        console.log(`✅ Subscription canceled: ${subscription.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
