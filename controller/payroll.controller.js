import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import Payroll from "../models/payroll.model.js";
import User from "../models/users.model.js";

export const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;
    
    const employees = await User.find({ role: "user" });
    
    for (const emp of employees) {
      //Prevent duplicate payroll
      const alreadyGenerated = await Payroll.findOne({
        userId: emp._id,
        month,
        year,
      });

      if (alreadyGenerated) continue;

      //Attendance summary
      const attendance = await Attendance.find({
        userId: emp._id,
        month,
        year,
      });

      const presentDays = attendance.filter(
        (a) => a.status === "Present",
      ).length;

      const halfDays = attendance.filter((a) => a.status === "Half Day").length;

      const workingDays = 26; // enterprise default
      const absentFromAttendance = workingDays - presentDays - halfDays;

      //LOP Leaves
      const lopLeaves = await Leave.countDocuments({
        userId: emp._id,
        leaveType: "LOP",
        status: "Approved",
        month,
        year,
      });

      const absentDays = absentFromAttendance + lopLeaves;

      // Salary calculation
      const perDaySalary = emp.basicSalary / workingDays;

      const deductions =
        absentDays * perDaySalary + halfDays * (perDaySalary / 2);

      const grossSalary = emp.basicSalary + emp.hra + emp.allowance;

      const netSalary = grossSalary - deductions;

      // Save payroll
      await Payroll.create({
        userId: emp._id,
        month,
        year,

        basicSalary: emp.basicSalary,
        hra: emp.hra,
        allowance: emp.allowance,

        deductions,

        workingDays,
        presentDays,
        halfDays,
        absentDays,

        netSalary,
      });
    }

    res.json({ message: "Payroll generated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const viewPaySlip = async (req, res) => {
  const { userId, month, year } = req.params;
  const payroll = await Payroll.findOne({ userId, month, year }).populate(
    "userId",
    "name email",
  );

  res.json({ payroll });
};
