import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { handleStripeWebhook } from "./services/payment.service.js";

import authRoutes from "./routes/auth.routes.js";
import flightRoutes from "./routes/flight.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reportRoutes from "./routes/report.routes.js";
import flightStatusRoutes from "./routes/flightStatusRoutes.js";

const app = express();
connectDB();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));

// ✅ Stripe webhook (raw body first)
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// ✅ JSON parser for all other routes
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/flight-status", flightStatusRoutes);

app.use((_, res) => res.status(404).json({ message: "Not found" }));

export default app;
