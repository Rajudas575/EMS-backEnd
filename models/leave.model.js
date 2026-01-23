import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    fromDate: Date,
    toDate: Date,

    leaveType: {
      type: String,
      enum: ["PL", "SL", "LOP"], // Paid / Sick / Loss of Pay
      default: "PL",
    },

    reason: String,

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave
