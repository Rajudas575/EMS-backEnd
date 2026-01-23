import Leave from "../models/leave.model.js";

export const applyLeave = async (req, res) => {
  try {
    const { userId, fromDate, toDate, leaveType, reason } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: "Dates are required" });
    }

    const leave = await Leave.create({
      userId,
      fromDate,
      toDate,
      leaveType,
      reason,
    });

    res.status(201).json({
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const viewLeave = async (req, res) => {
  const leaves = await Leave.find({ userId: req.params.userId }).sort({
    createdAt: -1,
  });

  res.json({ result: leaves });
};
