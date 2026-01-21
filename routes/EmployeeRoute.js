import express from "express";
import {
  getDetails,
  updateDetails,
} from "../controller/employee.controller.js";
import { authenticate } from "../middileware/authenticate.js";
import upload from "../config/multer.js";

const empRouter = express.Router();
empRouter.use(authenticate);
empRouter.get("/detail/:id", getDetails);
empRouter.put("/update_emp_profile/:id", upload.single("image"), updateDetails);

export default empRouter;
