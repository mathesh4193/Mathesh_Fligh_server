import { Router } from "express";
import { getFlightStatus } from "../services/flightStatus.service.js";

const router = Router();

router.get("/:flightNumber", async (req, res) => {
  try {
    const status = await getFlightStatus(req.params.flightNumber);
    if (!status) return res.status(404).json({ message: "No status found" });
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: "Error fetching flight status" });
  }
});

export default router;
