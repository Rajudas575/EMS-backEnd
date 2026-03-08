import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: String,
      required: true, // 'YYYY-MM-DD'
    },

    month: {
      type: Number, // 1–12
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    checkIn: { type: String, default: null },
    checkOut: { type: String, default: null },

    status: {
      type: String,
      enum: ["Present", "Absent", "Half-day", "Leave", "Holiday"],
      default: "Present",
    },
  },
  { timestamps: true },
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
