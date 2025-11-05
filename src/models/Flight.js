import mongoose from "mongoose";

const flightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true, unique: true },
    airline: { type: String, required: true },
    origin: { type: String, required: true },
    destination: { type: String, required: true },
    departureTime: { type: String, required: true }, // "09:30 AM"
    arrivalTime: { type: String, required: true },   // "12:15 PM"
    price: { type: Number, required: true },
    daysAvailable: { type: [String], required: true }, // ["Mon","Wed","Fri"]
  },
  { timestamps: true }
);

export default mongoose.model("Flight", flightSchema);
