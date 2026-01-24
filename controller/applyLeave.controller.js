import { getDaysBetween } from "../helpers/dateUtils.js";
import Leave from "../models/leave.model.js";
import LeaveBalance from "../models/leaveBalance.model.js";

export const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, leaveType, reason } = req.body;
    const userId = req.user.id;

    if (!fromDate || !toDate || !leaveType) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const year = new Date(fromDate).getFullYear();
    const daysRequested = getDaysBetween(fromDate, toDate);

    // 1️⃣ Get leave balance
    const balance = await LeaveBalance.findOne({ userId, year });

    if (!balance) {
      return res.status(400).json({
        message: "Leave balance not assigned by admin",
      });
    }

    // 2️⃣ Check balance
    if (leaveType === "PL" && balance.PL < daysRequested) {
      return res.status(400).json({
        message: "Insufficient Paid Leave balance",
      });
    }

    if (leaveType === "SL" && balance.SL < daysRequested) {
      return res.status(400).json({
        message: "Insufficient Sick Leave balance",
      });
    }

    // 3️⃣ Create leave request
    const leave = new Leave({
      userId,
      fromDate,
      toDate,
      leaveType,
      reason,
    });

    await leave.save();

    return res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error("APPLY LEAVE ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const viewLeave = async (req, res) => {
  const leaves = await Leave.find({ userId: req.params.userId }).sort({
    createdAt: -1,
  });

  res.json({ result: leaves });
};
