import express from "express";
import { createCheckoutSession, verifyPaymentStatus } from "../services/payment.service.js";
import Booking from "../models/Booking.js";

const router = express.Router();

router.post("/checkout", async (req, res) => {
  try {
    const { bookingId, successUrl, cancelUrl } = req.body;
    const booking = await Booking.findById(bookingId).populate("flight user");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const session = await createCheckoutSession({ booking, successUrl, cancelUrl });
    res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/verify/:bookingId", verifyPaymentStatus);

export default router;
