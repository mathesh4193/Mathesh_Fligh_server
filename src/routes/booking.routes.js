// src/routes/booking.routes.js
import { Router } from "express";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";
import { auth } from "../middleware/auth.js";
import { sendBookingEmail, sendSMS } from "../services/notification.service.js";
import { generateBookingPdf } from "../services/pdf.service.js";

const router = Router();

const generateSeatCode = (index) => {
  const rowLetter = String.fromCharCode(65 + Math.floor(index / 3)); 
  const seatNumber = (index % 3) + 1; 
  return `${rowLetter}${seatNumber}`;
};

const normalizePassengers = (arr = []) =>
  arr.slice(0, 9).map((p, i) => ({
    name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || `Passenger ${i + 1}`,
    gender: ["Male", "Female", "Other"].includes(p.gender) ? p.gender : "Other",
    age: p.age || 25,
    dob: p.dob || "",
    email: p.email || "",
    phone: p.phone || "",
    seat: p.seat && p.seat !== "Auto-Assigned" ? p.seat : generateSeatCode(i),
  }));

router.post("/", auth, async (req, res) => {
  try {
    const { flightId, travelClass, totalPrice, passengers } = req.body;

    if (!flightId || !travelClass || !totalPrice)
      return res.status(400).json({ message: "Missing required fields" });

    const flight = await Flight.findById(flightId);
    if (!flight) return res.status(404).json({ message: "Flight not found" });

    if (!Array.isArray(passengers) || passengers.length === 0)
      return res.status(400).json({ message: "At least one passenger required" });

    const pax = normalizePassengers(passengers);

    const booking = await Booking.create({
      user: req.user._id,
      flight: flight._id,
      passengers: pax,
      travelClass,
      totalPrice,
      status: "CONFIRMED",
    });

    if (req.user.email) {
      sendBookingEmail(req.user.email, { ...booking.toObject(), flight })
        .then(() => console.log(` Email sent to ${req.user.email}`))
        .catch((e) => console.warn(" Email send failed:", e.message));
    }

    if (req.user.phone) {
      sendSMS(req.user.phone, ` Booking confirmed: ${flight.origin} → ${flight.destination}`)
        .catch(() => {});
    }

    console.log(" Booking created:", booking._id);
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error(" Booking creation error:", err);
    res.status(500).json({ message: "Error creating booking" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("flight")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error(" Fetch bookings error:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("flight");

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ booking });
  } catch (err) {
    console.error(" Single booking fetch error:", err);
    res.status(500).json({ message: "Error fetching booking" });
  }
});

/* ---------------- Cancel a booking ---------------- */
router.post("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "CANCELLED";
    await booking.save();

    if (req.user.phone) {
      sendSMS(
        req.user.phone,
        ` Your booking ${booking.bookingReference || booking._id} has been cancelled.`
      ).catch(() => {});
    }

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error(" Cancel booking error:", err);
    res.status(500).json({ message: "Error cancelling booking" });
  }
});

router.post("/:id/change", auth, async (req, res) => {
  try {
    const { travelClass, passengers } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("flight");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (travelClass) booking.travelClass = travelClass;
    if (Array.isArray(passengers)) booking.passengers = normalizePassengers(passengers);

    booking.status = "CHANGED";
    await booking.save();

    res.json({ message: "Booking updated successfully", booking });
  } catch (err) {
    console.error(" Booking update error:", err);
    res.status(500).json({ message: "Error updating booking" });
  }
});

router.get("/:id/itinerary.pdf", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("flight");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const pdfDoc = await generateBookingPdf(booking);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${booking.bookingReference}.pdf"`
    );

    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error(" PDF generation error:", err);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

export default router;
