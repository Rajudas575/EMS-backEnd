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
  totalSalary,
} from "../controller/user.controller.js";
import upload from "../config/multer.js";
import { addCategory, getCategory } from "../controller/category.controller.js";
import { authenticate } from "../middileware/authenticate.js";

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

export default adminRouter;
