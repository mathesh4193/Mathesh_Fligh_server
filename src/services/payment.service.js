import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import { sendBookingEmail } from "./notification.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create Checkout Session
export const createCheckoutSession = async ({ booking, successUrl, cancelUrl }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${booking.flight.airline} (${booking.flight.flightNumber})`,
            description: `${booking.flight.origin} → ${booking.flight.destination}`,
          },
          unit_amount: Math.round(booking.totalPrice * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${successUrl}?bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { bookingId: booking._id.toString() },
  });

  await Payment.create({
    booking: booking._id,
    stripeSessionId: session.id,
    amount: booking.totalPrice,
    status: "created",
  });

  return session;
};

// ✅ Stripe Webhook Handler
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) throw new Error("Booking ID missing");

      const booking = await Booking.findById(bookingId).populate("flight user");
      if (!booking) throw new Error("Booking not found");

      // ✅ Update booking as paid
      booking.paymentStatus = "Paid";
      booking.status = "CONFIRMED";
      await booking.save();

      // ✅ Update payment
      await Payment.findOneAndUpdate(
        { stripeSessionId: session.id },
        {
          status: "paid",
          stripePaymentIntent: session.payment_intent,
          paymentDate: new Date(),
        }
      );

      // ✅ Send confirmation email
      if (booking.user?.email) {
        await sendBookingEmail({ to: booking.user.email, booking });
      }

      console.log(`✅ Booking ${booking.bookingReference} marked as Paid.`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handler error:", err.message);
    res.status(500).json({ message: "Internal webhook error" });
  }
};

// ✅ Manual verification (optional)
export const verifyPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const payment = await Payment.findOne({ booking: bookingId });

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);

    if (session.payment_status === "paid") {
      const booking = await Booking.findById(bookingId);
      booking.paymentStatus = "Paid";
      booking.status = "CONFIRMED";
      await booking.save();
      return res.json({ success: true, message: "Payment verified and booking updated" });
    }

    res.json({ success: false, message: "Payment still pending" });
  } catch (err) {
    res.status(500).json({ message: "Error verifying payment", error: err.message });
  }
};
