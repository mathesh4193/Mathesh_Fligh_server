import { Router } from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.put("/me", auth, async (req, res) => {
  try {
    const { name, phone, dateOfBirth, preferences } = req.body;

    const updates = {};
    if (typeof name === "string") updates.name = name;
    if (typeof phone === "string") updates.phone = phone;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (preferences) {
      updates.preferences = {
        seatPreference: preferences.seatPreference ?? req.user.preferences.seatPreference,
        mealPreference: preferences.mealPreference ?? req.user.preferences.mealPreference
      };
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    return res.json({ user: updated });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Update failed" });
  }
});

export default router;
