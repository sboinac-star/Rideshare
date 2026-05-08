import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, rideId, userId } = body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      metadata: {
        rideId,
        userId,
      },
      description: `NWA Ride Share - Ride ${rideId}`,
    });

    return NextResponse.json(
      { clientSecret: paymentIntent.client_secret },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Payment creation failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const intentId = req.nextUrl.searchParams.get("intentId");

    if (!intentId) {
      return NextResponse.json(
        { error: "intentId required" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    return NextResponse.json({ paymentIntent }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve payment" },
      { status: 500 }
    );
  }
}
