import express from "express";
import {
  checkIn,
  checkOut,
  getDetails,
  getMonthlyAttendanceSummary,
  getTodayAttendance,
  updateDetails,
} from "../controller/employee.controller.js";
import { authenticate } from "../middileware/authenticate.js";
import upload from "../config/multer.js";
import {
  generatePayroll,
  viewPaySlip,
} from "../controller/payroll.controller.js";
import { applyLeave, viewLeave } from "../controller/applyLeave.controller.js";

const empRouter = express.Router();
empRouter.use(authenticate);
empRouter.get("/detail/:id", getDetails);
empRouter.put("/update_emp_profile/:id", upload.single("image"), updateDetails);
empRouter.post("/checkin/:userId", checkIn);
empRouter.post("/checkout/:userId", checkOut);
empRouter.get("/getAtendanc/:userId", getTodayAttendance);
empRouter.get("/attendanceSummary/:userId", getMonthlyAttendanceSummary);
empRouter.post("/payroll/generate", generatePayroll);
empRouter.get("/payroll/:userId/:month/:year", viewPaySlip);
empRouter.post("/apply-leave", applyLeave);
empRouter.get("/leaves/:userId", viewLeave);

export default empRouter;
