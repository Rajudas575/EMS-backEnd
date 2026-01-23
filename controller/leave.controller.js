import Attendance from "../models/attendance.model.js";
import Leave from "../models/leave.model.js";
import { getDatesBetween } from "../helpers/getDatesBetween.js";

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
    const adminId = req.user._id;

    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    // 1️⃣ Update leave
    leave.status = "Approved";
    leave.approvedBy = adminId;
    await leave.save();

    // 2️⃣ Create attendance entries
    const dates = getDatesBetween(leave.fromDate, leave.toDate);

    for (const d of dates) {
      const dateStr = d.toISOString().split("T")[0];

      let status = "Present";
      if (leave.leaveType === "LOP") {
        status = "Absent";
      }

      await Attendance.findOneAndUpdate(
        { userId: leave.userId, date: dateStr },
        {
          userId: leave.userId,
          date: dateStr,
          status,
          checkIn: null,
          checkOut: null,
        },
        { upsert: true, new: true },
      );
    }

    res.status(200).json({
      message: "Leave approved & attendance updated",
    });
  } catch (error) {
    console.error("APPROVE LEAVE ERROR:", error);
    res.status(500).json({ message: error.message });
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
