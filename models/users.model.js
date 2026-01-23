import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    salaryStructure: {
      basic: { type: Number },
      hra: { type: Number, default: 0 },
      allowance: { type: Number, default: 0 },
    },

    address: {
      type: String,
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    image: {
      type: String,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema, "users");
export default User;
