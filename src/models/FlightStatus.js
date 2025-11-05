import mongoose from "mongoose";
const flightStatusSchema = new mongoose.Schema({
  flightNumber: String,
  date: String,          // YYYY-MM-DD
  status: String,        // scheduled, active, landed, cancelled, delayed
  departure: { airport: String, scheduled: String, actual: String },
  arrival: { airport: String, scheduled: String, actual: String },
  raw: Object
}, { timestamps: true });

export default mongoose.model("FlightStatus", flightStatusSchema);
