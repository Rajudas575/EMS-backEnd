import CompanyCalendar from "../models/companyHoliday.model.js";

export const setCompanyCalendar = async (req, res) => {
  console.log("SAVE CALENDAR BODY:", req.body);

  try {
    const { year, holidays, weeklyOff } = req.body;

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const calendar = await CompanyCalendar.findOneAndUpdate(
      { year },
      {
        year,
        holidays,
        weeklyOff,
      },
      { new: true, upsert: true },
    );

    res.status(200).json({
      message: "Company calendar saved successfully",
      calendar,
    });
  } catch (error) {
    console.error("CALENDAR SAVE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCompanyCalendar = async (req, res) => {
  try {
    const { year } = req.params;

    const calendar = await CompanyCalendar.findOne({ year });

    if (!calendar) {
      return res.status(404).json({
        message: "Calendar not found for this year",
      });
    }

    res.status(200).json(calendar);
  } catch (error) {
    console.error("GET CALENDAR ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
