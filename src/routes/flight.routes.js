import { Router } from "express";
import Flight from "../models/Flight.js";

const router = Router();

// ✅ Get all flights
router.get("/", async (_req, res) => {
  try {
    const flights = await Flight.find();
    res.json(flights); // ✅ Send array directly (frontend expects array)
  } catch (err) {
    console.error("Error fetching flights:", err.message);
    res.status(500).json({ message: "Error fetching flights" });
  }
});

// ✅ Get origins and destinations
router.get("/origins-destinations", async (_req, res) => {
  try {
    const flights = await Flight.find().select("origin destination -_id");

    const origins = [...new Set(flights.map((f) => f.origin))].sort();
    const destinations = [...new Set(flights.map((f) => f.destination))].sort();

    res.json({ origins, destinations });
  } catch (err) {
    console.error("Error fetching origins/destinations:", err.message);
    res.status(500).json({ message: "Error fetching origins/destinations" });
  }
});

// ✅ Search flights by origin, destination & date
router.get("/search", async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    if (!origin || !destination || !date) {
      return res
        .status(400)
        .json({ message: "origin, destination, and date are required" });
    }

    const dayOfWeek = new Date(date)
      .toLocaleDateString("en-US", { weekday: "short" })
      .replace(".", "");

    const flights = await Flight.find({
      origin: new RegExp(`^${origin}$`, "i"),
      destination: new RegExp(`^${destination}$`, "i"),
      daysAvailable: { $in: [dayOfWeek] },
    });

    if (!flights.length) {
      return res
        .status(404)
        .json({ message: `No flights found from ${origin} to ${destination}` });
    }

    res.json(flights); // ✅ Send array directly
  } catch (err) {
    console.error("Error searching flights:", err.message);
    res.status(500).json({ message: "Error searching flights" });
  }
});

export default router;
