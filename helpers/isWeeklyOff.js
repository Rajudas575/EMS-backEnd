export const isWeeklyOff = (date, weeklyOff) => {
  const day = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
  });
  return weeklyOff.includes(day);
};

export const isHoliday = (date, holidays) => {
  return holidays.some((h) => h.date === date);
};
