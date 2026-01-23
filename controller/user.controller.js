import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import cloudinary from "../config/cloudinary.js";
import { get } from "mongoose";
import { json } from "express";

export const addEmployee = async (req, res) => {
  console.log(req.body);
  try {
    const { name, email, password, address, category_id } = req.body;
    // Required validation
    if (!name || !email || !password || !category_id) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    // Email uniqueness
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Upload image if exists
    let imageUrl = null;
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        { folder: "employee-ms-images" },
      );
      imageUrl = uploadResult.secure_url;
    }

    let salaryStructure = undefined;

    salaryStructure = {
      basic: 0,
      hra: 0,
      allowance: 0,
    };

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      address,
      category_id,
      image: imageUrl,
      salaryStructure,
    });

    await user.save();

    return res.status(201).json({
      status: true,
      message: "Employee added successfully",
      user,
    });
  } catch (error) {
    console.error("ADD EMPLOYEE ERROR:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//---set salary---//
export const setSalaryStructure = async (req, res) => {
  try {
    const { userId } = req.params;
    const { basic, hra, allowance } = req.body;

    if (!basic || isNaN(basic)) {
      return res.status(400).json({
        status: false,
        message: "Basic salary is required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        salaryStructure: {
          basic: Number(basic),
          hra: Number(hra || 0),
          allowance: Number(allowance || 0),
        },
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }

    return res.json({
      status: true,
      message: "Salary structure updated successfully",
      salaryStructure: user.salaryStructure,
    });
  } catch (error) {
    console.error("SET SALARY ERROR:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//---GET Employees---//
// export const getEmployees = async (req, res) => {
//   try {
//     const getEmps = await User.find()
//       .populate("category_id", "category")
//       .select("-password");
//     if (getEmps) {
//       return res.status(200).json({
//         status: true,
//         result: getEmps,
//       });
//     } else {
//       return res.json.ststus(400).json({
//         status: false,
//         error: "There is no users",
//       });
//     }
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       error: error,
//     });
//   }
// };

export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find()
      .populate("category_id", "category")
      .select("-password");

    const result = employees.map((emp) => ({
      ...emp.toObject(),
      hasSalary: !!emp.salaryStructure?.basic,
    }));

    return res.status(200).json({
      status: true,
      result,
    });
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//-----Get By Id Employee-----//
export const getByIdEmployee = async (req, res) => {
  try {
    const id = req.params.id;
    const getEmps = await User.findById(id);
    if (getEmps) {
      return res.status(200).json({
        status: true,
        result: getEmps,
      });
    } else {
      return res.json.ststus(400).json({
        status: false,
        error: "There is no users",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error,
    });
  }
};

//----Edit Employee-----//
export const editEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, salary, address, category_id } = req.body;

    const employee = await User.findByIdAndUpdate(
      id,
      { name, email, salary, address, category_id },
      { new: true, runValidators: true },
    ).select("-password");

    if (!employee) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Employee updated successfully",
      result: employee,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//---If Use to update Password or Image then----//
// export const editEmployee = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { name, email, salary, address, category_id, password } = req.body;

//     const employee = await User.findById(id);
//     if (!employee) {
//       return res.status(404).json({
//         status: false,
//         message: "Employee not found",
//       });
//     }

//     employee.name = name;
//     employee.email = email;
//     employee.salary = salary;
//     employee.address = address;
//     employee.category_id = category_id;

//     if (password && password.trim() !== "") {
//       employee.password = await bcrypt.hash(password, 10);
//     }

//     if (req.file) {
//       const upload = await cloudinary.uploader.upload(req.file.path, {
//         folder: "employee-ms-images",
//       });
//       employee.image = upload.secure_url;
//     }

//     await employee.save();

//     res.status(200).json({
//       status: true,
//       message: "Employee updated successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       status: false,
//       error: error.message,
//     });
//   }
// };

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({
        status: false,
        message: "Employee not found",
      });
    }

    // Optional: delete image from Cloudinary
    // await cloudinary.uploader.destroy(employee.cloudinary_id);

    await User.findByIdAndDelete(id);

    res.json({
      status: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//----Count Admin ----//
export const adminCount = async (req, res) => {
  try {
    const countAdmin = await User.countDocuments({ role: "admin" });

    return res.status(200).json({
      status: true,
      result: countAdmin,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//----Count Employee ----//
export const employeeCount = async (req, res) => {
  try {
    const countEmployee = await User.countDocuments({ role: "user" });

    return res.status(200).json({
      status: true,
      result: countEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//---Total Salary ---//
export const totalSalary = async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        // only users who have salaryStructure
        $match: {
          "salaryStructure.basic": { $exists: true, $gt: 0 },
        },
      },
      {
        // calculate per-user gross salary
        $project: {
          grossSalary: {
            $add: [
              "$salaryStructure.basic",
              { $ifNull: ["$salaryStructure.hra", 0] },
              { $ifNull: ["$salaryStructure.allowance", 0] },
            ],
          },
        },
      },
      {
        // sum all users
        $group: {
          _id: null,
          totalSalary: { $sum: "$grossSalary" },
        },
      },
    ]);

    const totalSalary = result[0]?.totalSalary || 0;

    return res.status(200).json({
      status: true,
      result: totalSalary,
    });
  } catch (error) {
    console.error("TOTAL SALARY ERROR:", error);
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

export const adminDetails = async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" }).select("-password");

    return res.status(200).json({
      status: true,
      result: admin, // ✅ object
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//----Edit Admin-----//
export const adminEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, salary, address } = req.body;

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
      salary,
      address,
    };

    if (imageUrl) {
      updateData.image = imageUrl; // only update if exists
    }

    const admin = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Admin updated successfully",
      result: admin,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message,
    });
  }
};

//-----Login-------//
export const Login = async (req, res) => {
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
    { role: "admin", email: user.email, id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  return res.json({ loginStatus: true });
};
//---Log Out---//
export const LogOut = (req, res) => {
  res.clearCookie("token");
  return res.json({ status: true });
};
