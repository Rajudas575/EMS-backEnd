import express from "express";
import { addCategory, getCategory } from "../controller/category.controller.js";

const categoryRouter = express.Router();

categoryRouter.post("/add_category", addCategory);
categoryRouter.get("/category", getCategory);

export default categoryRouter;
