import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import cloudinary from "../config/cloudinary.js";

//-----Employee Login-------//
export const empLogin = async (req, res) => {
  
  const { email, password } = req.body;
  const user = await User.findOne({ email });

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
    const empData = await User.findById(empId);
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

export const updateDetails = async(req,res)=>{
  try {
    const { id } = req.params;
    const { name, email, address } = req.body;

    let imageUrl; 

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "employee-ms-images",
        }
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

    const empUpdate = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

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
}
//---Log Out---//
export const Logout = (req, res) => {
  res.clearCookie("token");
  return res.json({ status: true });
};
