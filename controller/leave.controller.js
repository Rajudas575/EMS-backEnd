import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import { getDatesBetween } from "../helpers/getDatesBetween.js";
import LeaveBalance from "../models/leaveBalance.model.js";
import { getDaysBetween } from "../helpers/dateUtils.js";

export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: "Pending" })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ result: leaves });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const adminId = req.user.id;

    // Find leave
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status === "Approved") {
      return res.status(400).json({ message: "Leave already approved" });
    }

    // Calculate days & year
    const dates = getDatesBetween(leave.fromDate, leave.toDate);
    const days = dates.length;
    const year = new Date(leave.fromDate).getFullYear();

    // Find leave balance
    const balance = await LeaveBalance.findOne({
      userId: leave.userId,
      year,
    });

    if (!balance && leave.leaveType !== "LOP") {
      return res.status(400).json({
        message: "Leave balance not assigned",
      });
    }

    // Deduct leave balance (PL / SL only)
    if (leave.leaveType === "PL") {
      if (balance.PL < days) {
        return res
          .status(400)
          .json({ message: "Insufficient PL balance" });
      }
      balance.PL -= days;
    }

    if (leave.leaveType === "SL") {
      if (balance.SL < days) {
        return res
          .status(400)
          .json({ message: "Insufficient SL balance" });
      }
      balance.SL -= days;
    }

    if (balance) {
      await balance.save();
    }

    // CREATE / UPDATE ATTENDANCE
    for (const date of dates) {
      await Attendance.findOneAndUpdate(
        { userId: leave.userId, date },
        {
          userId: leave.userId,
          date,
          checkIn: null,
          checkOut: null,
          status: leave.leaveType === "LOP" ? "Absent" : "Absent",
        },
        { upsert: true, new: true }
      );
    }

    // Approve leave
    leave.status = "Approved";
    leave.approvedBy = adminId;
    await leave.save();

    return res.status(200).json({
      message: "Leave approved, attendance updated, balance adjusted",
    });
  } catch (error) {
    console.error("APPROVE LEAVE ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const adminId = req.user._id;

    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      {
        status: "Rejected",
        approvedBy: adminId,
      },
      { new: true },
    );

    res.status(200).json({
      message: "Leave rejected",
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaveBalance = async (req, res) => {
  try {
    const { userId, year } = req.params;

    const balance = await LeaveBalance.findOne({ userId, year });

    // If admin hasn't assigned leave yet
    if (!balance) {
      return res.status(200).json({
        result: {
          PL: 0,
          SL: 0,
        },
      });
    }

    res.status(200).json({
      result: {
        PL: balance.PL,
        SL: balance.SL,
      },
    });
  } catch (error) {
    console.error("GET LEAVE BALANCE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const assignLeaveBalance = async (req, res) => {
  console.log(req.body);
  try {
    const { userId, year, PL, SL } = req.body;

    if (!userId || !year) {
      return res.status(400).json({
        message: "User and year are required",
      });
    }

    const leaveBalance = await LeaveBalance.findOneAndUpdate(
      { userId, year },
      {
        userId,
        year,
        PL: Number(PL) || 0,
        SL: Number(SL) || 0,
        createdBy: req.user.id, // admin id
      },
      {
        upsert: true,
        new: true,
      },
    );

    return res.status(200).json({
      message: "Leave assigned successfully",
      leaveBalance,
    });
  } catch (error) {
    console.error("ASSIGN LEAVE ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
