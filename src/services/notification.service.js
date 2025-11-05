import nodemailer from "nodemailer";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendBookingEmail = async (toEmail, booking) => {
  try {
    const flight = booking.flight || {};
    const passengers = booking.passengers || [];

    const passengerList = passengers
      .map(
        (p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name}</td>
          <td>${p.gender}</td>
          <td>${p.seat}</td>
        </tr>`
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color:#1d4ed8;">✈️ Booking Confirmation - ${
          booking.bookingReference || booking._id
        }</h2>
        <p>Dear ${booking.user?.name || "Traveler"},</p>
        <p>Your flight booking has been confirmed successfully.</p>
        <h3>Flight Details:</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
          <tr><td><b>Airline:</b></td><td>${flight.airline || "N/A"}</td></tr>
          <tr><td><b>Flight No:</b></td><td>${flight.flightNumber || "N/A"}</td></tr>
          <tr><td><b>Route:</b></td><td>${flight.origin} → ${flight.destination}</td></tr>
          <tr><td><b>Departure:</b></td><td>${flight.departureTime}</td></tr>
          <tr><td><b>Arrival:</b></td><td>${flight.arrivalTime}</td></tr>
        </table>
        <h3>Passengers:</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <thead style="background:#e0f2fe;"><tr><th>#</th><th>Name</th><th>Gender</th><th>Seat</th></tr></thead>
          <tbody>${passengerList}</tbody>
        </table>
        <p><b>Class:</b> ${booking.travelClass}</p>
        <p><b>Total Fare:</b> ₹${booking.totalPrice.toLocaleString()}</p>
        <p><b>Status:</b> ${booking.status}</p>
        <hr />
        <p>Thank you for booking with <b>Mathesh Airlines</b> 🛫</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Mathesh Flight Booking" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your Flight Booking Confirmation (${
        booking.bookingReference || booking._id
      })`,
      html: htmlContent,
    });

    console.log(" Email sent successfully to:", toEmail);
  } catch (err) {
    console.error(" Failed to send email:", err.message);
  }
};

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendSMS = async (toPhone, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE, 
      to: toPhone,
    });
    console.log(" SMS sent successfully to:", toPhone);
  } catch (err) {
    console.error(" Failed to send SMS:", err.message);
  }
};
