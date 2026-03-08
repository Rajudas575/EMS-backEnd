import Attendance from "../models/attendance.model.js";
import CompanyCalendar from "../models/companyHoliday.model.js";
import Leave from "../models/leave.model.js";
import Payroll from "../models/payroll.model.js";
import User from "../models/users.model.js";
import { calculateProfessionalTax } from "../helpers/professionalTax.js";

/* ---------- helpers ---------- */
const getMonthRange = (year, month) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  return { start, end };
};

const countLeaveDaysInMonth = (leave, start, end) => {
  const from = new Date(Math.max(leave.fromDate, start));
  const to = new Date(Math.min(leave.toDate, end));

  const days =
    (to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24) +
    1;

  return Math.max(days, 0);
};

/* ======================================================
   GENERATE PAYROLL
====================================================== */
export const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) {
      return res.status(400).json({ message: "Month & Year required" });
    }

    const calendar = await CompanyCalendar.findOne({ year });
    if (!calendar) {
      return res.status(400).json({ message: "Company calendar not set" });
    }

    const { holidays = [], weeklyOff = ["Saturday", "Sunday"] } = calendar;
    const { start, end } = getMonthRange(year, month);

    const employees = await User.find({ role: "user" });

    for (const emp of employees) {
      const exists = await Payroll.findOne({
        userId: emp._id,
        month,
        year,
      });
      if (exists) continue;

      /* ---------- DAYS ---------- */
      const totalDays = new Date(year, month, 0).getDate();

      const holidayCount = holidays.filter((h) => {
        const d = new Date(h.date);
        return d >= start && d <= end;
      }).length;

      let weeklyOffCount = 0;
      for (let d = 1; d <= totalDays; d++) {
        const dayName = new Date(year, month - 1, d).toLocaleDateString(
          "en-US",
          { weekday: "long" }
        );
        if (weeklyOff.includes(dayName)) weeklyOffCount++;
      }

      const workingDays = Math.max(
        totalDays - holidayCount - weeklyOffCount,
        0
      );

      /* ---------- ATTENDANCE ---------- */
      const attendance = await Attendance.find({
        userId: emp._id,
        month,
        year,
      });

      let presentDays = 0;
      let halfDays = 0;

      attendance.forEach((a) => {
        if (a.status === "Present") presentDays++;
        if (a.status === "Half-day") halfDays++;
      });

      /* ---------- LEAVES (DATE RANGE BASED) ---------- */
      const leaves = await Leave.find({
        userId: emp._id,
        status: "Approved",
        fromDate: { $lte: end },
        toDate: { $gte: start },
      });

      let cl = 0,
        sl = 0,
        lop = 0;

      leaves.forEach((l) => {
        const days = countLeaveDaysInMonth(l, start, end);
        if (l.leaveType === "CL") cl += days;
        if (l.leaveType === "SL") sl += days;
        if (l.leaveType === "LOP") lop += days;
      });

      const paidLeaves = cl + sl;

      /* ---------- PAYABLE / LOP ---------- */
      const payableDays = presentDays + halfDays * 0.5 + paidLeaves;
      const lopDays = Math.max(workingDays - payableDays, 0);

      /* ---------- SALARY ---------- */
      const basic = Number(emp.salaryStructure?.basic || 0);
      const hra = Number(emp.salaryStructure?.hra || 0);
      const allowance = Number(emp.salaryStructure?.allowance || 0);

      const grossSalary = basic + hra + allowance;
      const perDaySalary =
        workingDays > 0 ? grossSalary / workingDays : 0;

      const lopDeduction = Number((lopDays * perDaySalary).toFixed(2));
      const professionalTax = calculateProfessionalTax(grossSalary);

      const netSalary = Math.max(
        Math.round(grossSalary - lopDeduction - professionalTax),
        0
      );

      /* ---------- SAVE ---------- */
      await Payroll.create({
        userId: emp._id,
        month,
        year,

        totalDays,
        holidays: holidayCount,
        weeklyOff: weeklyOffCount,
        workingDays,

        presentDays,
        halfDays,
        paidLeaves,
        lopLeaves: lop,

        payableDays,
        lopDays,

        basicSalary: basic,
        hra,
        allowance,
        grossSalary,

        perDaySalary,
        lopDeduction,
        professionalTax,

        leaveBreakup: {
          CL: cl,
          SL: sl,
          LOP: lop,
        },

        netSalary,
      });
    }

    res.status(200).json({
      message: `Payroll generated successfully for ${month}/${year}`,
    });
  } catch (error) {
    console.error("PAYROLL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   VIEW PAYSLIP
====================================================== */
export const viewPaySlip = async (req, res) => {
  const { userId, month, year } = req.params;
  const payroll = await Payroll.findOne({ userId, month, year }).populate(
    "userId",
    "name email"
  );
  res.json({ payroll });
};

/* ======================================================
   ADMIN PAYROLL LIST
====================================================== */
export const getPayrollList = async (req, res) => {
  const { month, year } = req.query;
  const payrolls = await Payroll.find({ month, year })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  res.json(payrolls);
};

/* ======================================================
   LOCK PAYROLL
====================================================== */
export const lockPayroll = async (req, res) => {
  const { id } = req.params;
  const payroll = await Payroll.findById(id);

  if (!payroll) {
    return res.status(404).json({ message: "Payroll not found" });
  }

  payroll.isLocked = true;
  await payroll.save();

  res.json({ message: "Payroll locked successfully" });
};
