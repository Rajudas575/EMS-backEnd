export const getWorkingDays = (year, month, weeklyOff, holidays) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  let workingDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayName = d.toLocaleString("en-US", { weekday: "long" });
    const dateStr = d.toISOString().split("T")[0];

    const isWeeklyOff = weeklyOff.includes(dayName);
    const isHoliday = holidays.some((h) => h.date === dateStr);

    if (!isWeeklyOff && !isHoliday) {
      workingDays++;
    }
  }

  return workingDays;
};
