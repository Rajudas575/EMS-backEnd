import express from "express";
import { onlyadmin } from "../middileware/onlyadmin.js";
import {
  addEmployee,
  adminCount,
  adminDetails,
  adminEdit,
  deleteEmployee,
  editEmployee,
  employeeCount,
  getByIdEmployee,
  getEmployees,
  setSalaryStructure,
  totalSalary,
} from "../controller/user.controller.js";
import upload from "../config/multer.js";
import { addCategory, getCategory } from "../controller/category.controller.js";
import { authenticate } from "../middileware/authenticate.js";
import {
  approveLeave,
  getPendingLeaves,
  rejectLeave,
} from "../controller/leave.controller.js";
import { generatePayroll } from "../controller/payroll.controller.js";

const adminRouter = express.Router();
adminRouter.use(authenticate);
adminRouter.use(onlyadmin);

// router.post("/adminlogin",onlyadmin, login);

adminRouter.post(
  "/add_employee",
  onlyadmin,
  (req, res, next) => {
    upload.single("image")(req, res, function (err) {
      if (err) {
        return res.status(400).json({
          status: false,
          message: err.message,
        });
      }
      next();
    });
  },
  addEmployee,
);

adminRouter.put("/set-salary/:userId", setSalaryStructure);
adminRouter.post("/add_category", addCategory);
adminRouter.get("/category", getCategory);

adminRouter.get("/employees", getEmployees);
adminRouter.get("/employee/:id", getByIdEmployee);
adminRouter.put("/edit_employee/:id", editEmployee);
adminRouter.delete("/delete_employee/:id", deleteEmployee);
adminRouter.get("/admin_count", adminCount);
adminRouter.get("/employee_count", employeeCount);
adminRouter.get("/totalSalary", totalSalary);
adminRouter.get("/admin_detail", adminDetails);
adminRouter.put("/edit_admin/:id", upload.single("image"), adminEdit);
adminRouter.get("/leave/:id/approve", approveLeave);
adminRouter.get("/leave/:id/reject", rejectLeave);
adminRouter.post("/payroll/generate", generatePayroll);
adminRouter.get("/leave/pending", getPendingLeaves);
adminRouter.put("/leave/approve/:leaveId", approveLeave);
adminRouter.put("/admin/reject/:leaveId", rejectLeave);

export default adminRouter;
