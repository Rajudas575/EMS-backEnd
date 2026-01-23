import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true }, // e.g., '2026-01-22'
  checkIn: { type: String, default: null }, // '09:00'
  checkOut: { type: String, default: null }, // '18:00'
  status: {
    type: String,
    enum: ["Present", "Absent", "Half-day"],
    default: "Present",
  },
});

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
