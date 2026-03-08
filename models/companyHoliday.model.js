import mongoose from "mongoose";

const companyCalendarSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
    },

    holidays: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        name: { type: String, required: true },
      },
    ],

    weeklyOff: {
      type: [String],
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      default: ["Saturday", "Sunday"],
    },
  },
  { timestamps: true },
);

const CompanyCalendar = mongoose.model(
  "CompanyCalendar",
  companyCalendarSchema,
);

export default CompanyCalendar;
