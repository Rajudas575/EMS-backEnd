import express from "express";
import { Login, LogOut } from "../controller/user.controller.js";
import { empLogin } from "../controller/employee.controller.js";

const authRoute = express.Router();

authRoute.post("/login", Login);
authRoute.post("/employee_login", empLogin);
authRoute.get("/logout", LogOut);

export default authRoute;
