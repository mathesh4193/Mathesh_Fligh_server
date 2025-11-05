import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateBookingPdf = async (booking) => {
  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
  });

  const flight = booking.flight || {};
  const passengers = booking.passengers || [];

  const ticketNumber = "TKT-" + booking._id.toString().slice(-6).toUpperCase();

  const qrData = `Booking Ref: ${booking.bookingReference}
Passengers: ${passengers.map((p) => p.name).join(", ")}
Flight: ${flight.flightNumber}
Route: ${flight.origin} → ${flight.destination}
Departure: ${flight.departureTime}
Arrival: ${flight.arrivalTime}`;
  const qrImage = await QRCode.toDataURL(qrData);
  const qrBuffer = Buffer.from(qrImage.split(",")[1], "base64");

  doc.rect(0, 0, doc.page.width, 70).fill("#003366");
  doc.fillColor("white").font("Helvetica-Bold").fontSize(22).text("Flight E-Ticket", 50, 25);
  doc.font("Helvetica").fontSize(11);
  doc.text(`Booking Ref: ${booking.bookingReference}`, 400, 30, { align: "right" });
  doc.text(`Ticket No: ${ticketNumber}`, 400, 45, { align: "right" });
  doc.fillColor("#000");

  doc.moveDown(2);
  doc.font("Helvetica").fontSize(12);
  doc.text(`Dear Passenger,`, 50, 90);
  doc.moveDown(0.3);
  doc.text(`Your flight from ${flight.origin} to ${flight.destination} is confirmed.`, 50);
  doc.text(`Flight No: ${flight.flightNumber || "N/A"}`, 50);
  doc.moveDown(1);

  const summaryY = doc.y + 5;
  doc.roundedRect(50, summaryY, 500, 90, 10).fill("#f4f7ff").stroke("#b0c4de");

  // Departure info
  doc.fillColor("#003366").font("Helvetica-Bold").fontSize(14).text(flight.origin || "Origin", 70, summaryY + 15);
  doc.fillColor("#000").font("Helvetica").fontSize(12).text(flight.departureTime || "N/A", 70, summaryY + 35);

  // Center arrow
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#003366").text("to", 265, summaryY + 25);

  // Arrival info
  doc.fillColor("#003366").font("Helvetica-Bold").fontSize(14).text(flight.destination || "Destination", 370, summaryY + 15);
  doc.fillColor("#000").font("Helvetica").fontSize(12).text(flight.arrivalTime || "N/A", 370, summaryY + 35);

  // QR Code
  doc.image(qrBuffer, 470, summaryY + 10, { width: 60, height: 60 });

  const passengerStartY = summaryY + 120;
  doc.fillColor("#003366").font("Helvetica-Bold").fontSize(14).text("Passenger Details", 50, passengerStartY);
  const tableY = passengerStartY + 20;

  // Table Headers
  const headers = ["#", "Name", "Gender", "DOB", "Email", "Phone", "Seat"];
  const colX = [55, 80, 200, 260, 330, 430, 510];

  doc.rect(50, tableY, 500, 20).fill("#eaf0fb").stroke("#b0c4de");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#000");
  headers.forEach((header, i) => doc.text(header, colX[i], tableY + 5));

  // Passenger Rows
  let rowY = tableY + 25;
  const rowHeight = 18;
  const seatRows = ["A", "B", "C"];

  passengers.forEach((p, idx) => {
    const seatCode = p.seat && p.seat !== "Auto-Assigned"
      ? p.seat
      : `${seatRows[Math.floor(idx / 3)]}${(idx % 3) + 1}`; 

    doc.rect(50, rowY - 3, 500, rowHeight).stroke("#b0c4de");
    const vals = [
      idx + 1,
      p.name || "N/A",
      p.gender || "N/A",
      p.dob || "-",
      p.email || "-",
      p.phone || "-",
      seatCode,
    ];
    doc.font("Helvetica").fontSize(9).fillColor("#000");
    vals.forEach((val, i) => doc.text(val, colX[i], rowY));
    rowY += rowHeight;
  });

  const seatY = rowY + 20;
  doc.fillColor("#003366").font("Helvetica-Bold").fontSize(14).text("Seat Layout", 50, seatY);
  const layoutY = seatY + 25;
  const boxWidth = 50;
  const boxHeight = 25;
  const spacing = 10;

  const seatAssignments = passengers.map((p, idx) => ({
    seat:
      p.seat && p.seat !== "Auto-Assigned"
        ? p.seat
        : `${seatRows[Math.floor(idx / 3)]}${(idx % 3) + 1}`,
    name: p.name,
  }));

  seatAssignments.forEach((s, i) => {
    const x = 60 + (i % 6) * (boxWidth + spacing);
    const y = layoutY + Math.floor(i / 6) * (boxHeight + 10);
    doc.rect(x, y, boxWidth, boxHeight).stroke("#b0c4de").fill("#f9fbff");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#003366").text(s.seat, x + 17, y + 7);
  });

  const fareY = layoutY + 70;
  doc.fillColor("#003366").font("Helvetica-Bold").fontSize(14).text("Fare Details", 50, fareY);
  const fareBoxY = fareY + 20;
  doc.roundedRect(50, fareBoxY, 500, 90, 8).stroke("#b0c4de");

  const leftCol = 70;
  const rightCol = 420;
  const fareItems = [
    ["Base Fare", `₹${(booking.totalPrice - 300).toLocaleString()}`],
    ["Taxes & Fees", "₹300"],
    ["Discount", "₹0"],
    ["Total Amount", `₹${booking.totalPrice.toLocaleString()}`],
  ];

  let yPos = fareBoxY + 12;
  doc.font("Helvetica").fontSize(10).fillColor("#000");
  fareItems.forEach(([label, value]) => {
    doc.text(label, leftCol, yPos);
    doc.text(value, rightCol, yPos);
    yPos += 20;
  });

  const footerY = doc.page.height - 90;
  doc.rect(0, footerY, doc.page.width, 70).fill("#003366");
  doc.fillColor("white").font("Helvetica-Bold").fontSize(12).text("Thank you for choosing Mathesh Airlines!", 0, footerY + 15, {
    align: "center",
  });
  doc.font("Helvetica").fontSize(10).fillColor("#e0e0e0").text(
    "For assistance, contact support@flightbooking.com | +91-98765 43210",
    { align: "center" }
  );
  doc.text("© 2025 Mathesh Flight Booking System", { align: "center" });

  return doc;
};
