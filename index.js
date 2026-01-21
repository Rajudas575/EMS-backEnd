import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { authenticate } from "./middileware/authenticate.js";
import cookieParser from "cookie-parser";
import empRouter from "./routes/EmployeeRoute.js";
import authRoute from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";

dotenv.config();
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

//vercel setup
let cachedConnection = null;

async function connectToMongoDB() {
  if (cachedConnection) return cachedConnection;

  cachedConnection = await mongoose.connect(process.env.MONGODB_URL, {
    dbName: "readyforread_db",
  });

  console.log("MongoDB connected");
  return cachedConnection;
}

app.use(async (req, res, next) => {
  await connectToMongoDB();
  next();
});

app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});
//vercel setup

app.use("/auth", authRoute);
app.use("/auth", adminRouter);
app.use("/employee", empRouter);

app.get("/verify", authenticate, (req, res) => {
  return res.status(200).json({
    status: true,
    role: req.user.role,
    id: req.user.id
  });
});


//MongoDb Connection
// mongoose
//   .connect(process.env.MONGODB_URL, { dbName: "employee_ms" })
//   .then(() => console.log("Database connected."))
//   .catch((error) => console.log("Database connection faild", error));

// app.listen(process.env.PORT, () => {
//   console.log("Server is run successfully.");
// });

export default app
