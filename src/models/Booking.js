import mongoose from "mongoose";
import crypto from "crypto";

/* -------------------- Passenger Subschema -------------------- */
const passengerSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Full name (first + last)
  age: { type: Number, default: 25 },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Unspecified"],
    default: "Unspecified",
  },
  seat: { type: String, default: "Auto-Assigned" },
  dob: { type: String },
  email: { type: String },
  phone: { type: String },
});

/* -------------------- Booking Schema -------------------- */
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true,
    },
    passengers: [passengerSchema],
    totalPrice: { type: Number, required: true },

    travelClass: {
      type: String,
      enum: ["Economy", "Business", "First Class"],
      default: "Economy",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: ["CONFIRMED", "CANCELLED", "CHANGED"],
      default: "CONFIRMED",
    },

    bookingReference: {
      type: String,
      unique: true,
      default: () =>
        "BK" + crypto.randomBytes(3).toString("hex").toUpperCase(),
    },
  },
  { timestamps: true }
);

/* -------------------- Hooks -------------------- */
bookingSchema.pre("save", function (next) {
  // Generate booking reference if missing
  if (!this.bookingReference) {
    this.bookingReference = "BK" + crypto.randomBytes(3).toString("hex").toUpperCase();
  }
  next();
});

/* -------------------- Model Export -------------------- */
export default mongoose.model("Booking", bookingSchema);
