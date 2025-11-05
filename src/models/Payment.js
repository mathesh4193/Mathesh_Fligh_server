import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    stripeSessionId: { type: String, required: true },
    stripePaymentIntent: { type: String },
    amount: { type: Number, required: true }, // in rupees
    currency: {
      type: String,
      enum: ["INR"], // limit to Indian Rupees
      default: "INR",
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
