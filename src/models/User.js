import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Preferences sub-schema
const PreferencesSchema = new mongoose.Schema(
  {
    seatPreference: {
      type: String,
      enum: ["window", "middle", "aisle"],
      default: "window",
    },
    mealPreference: {
      type: String,
      enum: ["regular", "vegetarian", "vegan", "kosher", "halal"],
      default: "regular",
    },
  },
  { _id: false }
);

// User schema
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true, select: false },
    dateOfBirth: { type: Date, default: null },
    preferences: { type: PreferencesSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", UserSchema);
