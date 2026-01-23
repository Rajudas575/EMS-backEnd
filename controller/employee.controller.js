import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import cloudinary from "../config/cloudinary.js";
import Attendance from "../models/attendance.model.js";

//-----Employee Login-------//
export const empLogin = async (req, res) => {

  const { email, password } = req.body;
  const user = await User.findOne({ email, role: "user" });

  // Check email
  if (!user) {
    return res.json({ loginStatus: false, Error: "Invalid email or password" });
  }
  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.json({ loginStatus: false, Error: "Invalid email or password" });
  }
  // Generate token
  const token = jwt.sign(
    { role: "user", email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  res.cookie("token", token, { httpOnly: true });
  return res.json({
    loginStatus: true,
    message: "User Loggedin Successfully",
    id: user._id,
  });
};

//----Get Details of Employee----//
export const getDetails = async (req, res) => {
  try {
    const empId = req.params.id;
    const empData = await User.findById(empId).populate(
      "category_id",
      "category",
    );
    if (empData) {
      return res.status(200).json({
        status: true,
        result: empData,
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "No details found!",
      });
    }
  } catch (error) {
    return res.status(500).json({ status: false, message: error });
  }
};

export const updateDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address } = req.body;

    let imageUrl;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "employee-ms-images",
        },
      );
      imageUrl = uploadResult.secure_url;
    }

    const updateData = {
      name,
      email,
      address,
    };

    if (imageUrl) {
      updateData.image = imageUrl; // only update if exists
    }

    const empUpdate = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!empUpdate) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Your profile updated successfully",
      result: empUpdate,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//---Check In ---//
export const checkIn = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // Check if already checked in
    let attendance = await Attendance.findOne({ userId, date: today });
    if (attendance)
      return res.status(400).json({ message: "Already checked in" });

    // Create attendance record
    attendance = new Attendance({
      userId,
      date: today,
      checkIn: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "Present",
    });

    await attendance.save();
    res.status(200).json({ message: "Check-in successful", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//---Check Out ---//
export const checkOut = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    let attendance = await Attendance.findOne({ userId, date: today });
    if (!attendance)
      return res.status(400).json({ message: "No check-in found" });
    if (attendance.checkOut)
      return res.status(400).json({ message: "Already checked out" });

    // Update checkOut time
    attendance.checkOut = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Optional: update status for half-day if worked less than 4 hours
    const [inHour, inMinute] = attendance.checkIn.split(":").map(Number);
    const [outHour, outMinute] = attendance.checkOut.split(":").map(Number);
    const hoursWorked = outHour + outMinute / 60 - (inHour + inMinute / 60);
    if (hoursWorked < 4) attendance.status = "Half-day";

    await attendance.save();
    res.status(200).json({ message: "Check-out successful", attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//--Get Attendance ---//
export const getTodayAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const attendance = await Attendance.findOne({ userId, date: today });
    res.status(200).json(attendance); // can be null
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//--get cal working day--//
const getWorkingDaysInMonth = (year, month) => {
  let workingDays = 0;
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    // Exclude Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return workingDays;
};

//---Attendance Summary ---//
export const getMonthlyAttendanceSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

    const attendance = await Attendance.find({
      userId,
      date: { $regex: `^${monthPrefix}` },
    });

    const presentDays = attendance.filter((a) => a.status === "Present").length;
    const halfDays = attendance.filter((a) => a.status === "Half-day").length;

    const workingDays = getWorkingDaysInMonth(year, month);
    const absentDays = workingDays - presentDays - halfDays;

    res.status(200).json({
      month: monthPrefix,
      workingDays,
      presentDays,
      halfDays,
      absentDays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//---Log Out---//
export const Logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ status: true });
};
