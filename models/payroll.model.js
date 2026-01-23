import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    month: { type: Number, required: true }, // 1–12
    year: { type: Number, required: true },

    basicSalary: { type: Number, required: true },
    hra: { type: Number, default: 0 },
    allowance: { type: Number, default: 0 },

    deductions: { type: Number, default: 0 }, // PF, tax, etc.

    workingDays: Number,
    presentDays: Number,
    halfDays: Number,
    absentDays: Number,

    netSalary: Number,
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Payroll = mongoose.model("Payroll", payrollSchema);
export default Payroll;
