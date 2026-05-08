const Stripe = require('stripe');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'POST') {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const body = JSON.parse(event.body);
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ clientSecret: paymentIntent.client_secret })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Payment creation failed" })
      };
    }
  }

  if (event.httpMethod === 'GET') {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intentId = event.queryStringParameters?.intentId;

      if (!intentId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "intentId required" })
        };
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ paymentIntent })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Failed to retrieve payment" })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: "Method not allowed" })
  };
};