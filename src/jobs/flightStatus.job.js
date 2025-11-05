import cron from "node-cron";
import Booking from "../models/Booking.js";
import FlightStatus from "../models/FlightStatus.js";
import { fetchFlightStatus } from "../services/airline.service.js";
import { sendSMS } from "../services/notification.service.js";

cron.schedule("*/10 * * * *", async () => {
  try {
    const bookings = await Booking.find({ status: { $ne: "CANCELLED" } }).populate("flight");
    for (const b of bookings) {
      const date = new Date(b.bookingDate).toISOString().slice(0, 10);
      const data = await fetchFlightStatus({ flightNumber: b.flight.flightNumber, date });
      const f = data?.data?.[0];
      if (!f) continue;

      const current = {
        flightNumber: b.flight.flightNumber,
        date,
        status: f.flight_status,
        departure: {
          airport: f.departure?.airport,
          scheduled: f.departure?.scheduled,
          actual: f.departure?.actual,
        },
        arrival: {
          airport: f.arrival?.airport,
          scheduled: f.arrival?.scheduled,
          actual: f.arrival?.actual,
        },
        raw: f,
      };

      const prev = await FlightStatus.findOne({ flightNumber: current.flightNumber, date });
      if (!prev || prev.status !== current.status) {
        await FlightStatus.findOneAndUpdate({ flightNumber: current.flightNumber, date }, current, { upsert: true });
        await sendSMS(b.user, `Flight ${b.flight.flightNumber} is now ${current.status}`);
      }
    }
  } catch (e) {
    console.error("Flight status job error:", e.message);
  }
});
