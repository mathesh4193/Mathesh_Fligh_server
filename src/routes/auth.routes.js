import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });


router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, dateOfBirth, preferences } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      preferences,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: "Invalid credentials" });

    const token = signToken(user._id);
    res.json({ token, user: user.toJSON() });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Login failed" });
  }
});


router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const { id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    console.error("Token validation error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

export default router;
