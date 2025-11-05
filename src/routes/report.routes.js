// routes/reports.routes.js
import { Router } from "express";
import Booking from "../models/Booking.js";
import Flight from "../models/Flight.js";
import { auth } from "../middleware/auth.js"; //  import auth middleware

const router = Router();

/**
 * @route GET /api/reports/summary
 * @desc  Generate user-specific booking & revenue analytics
 */
router.get("/summary", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    //  Fetch only this user's bookings
    const userBookings = await Booking.find({ user: userId }).populate("flight");

    const totalBookings = userBookings.length;
    const totalSales = userBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const avgPrice = totalBookings ? totalSales / totalBookings : 0;
    const cancelled = userBookings.filter((b) => b.status === "CANCELLED").length;
    const cancelRate = totalBookings ? (cancelled / totalBookings) * 100 : 0;

    //  Monthly Trend
    const monthlyTrend = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const formattedMonthly = monthlyTrend.map((m) => ({
      month: monthNames[m._id - 1],
      count: m.count,
    }));

    //  Top Routes for this user
    const popularRoutes = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: "flights",
          localField: "flight",
          foreignField: "_id",
          as: "flightData",
        },
      },
      { $unwind: "$flightData" },
      {
        $group: {
          _id: {
            origin: "$flightData.origin",
            dest: "$flightData.destination",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    //  Class Distribution for this user
    const classDistribution = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$travelClass",
          value: { $sum: 1 },
        },
      },
    ]).then((res) =>
      res.map((r) => ({
        name: r._id,
        value: r.value,
      }))
    );

    res.json({
      totalBookings,
      totalSales,
      avgPrice,
      cancelRate,
      monthlyTrend: formattedMonthly,
      popularRoutes,
      classDistribution,
    });
  } catch (err) {
    console.error(" Report generation error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

export default router;
