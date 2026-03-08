import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    month: Number,
    year: Number,

    totalDays: Number,
    holidays: Number,
    weeklyOff: Number,
    workingDays: Number,

    presentDays: Number,
    halfDays: Number,
    paidLeaves: Number,
    lopLeaves: Number,

    payableDays: Number,
    lopDays: Number,

    basicSalary: Number,
    hra: Number,
    allowance: Number,
    grossSalary: Number,

    perDaySalary: Number,
    lopDeduction: Number,

    professionalTax: {
      type: Number,
      default: 0,
    },

    netSalary: Number,

    leaveBreakup: {
      CL: { type: Number, default: 0 },
      SL: { type: Number, default: 0 },
      LOP: { type: Number, default: 0 },
    },

    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
