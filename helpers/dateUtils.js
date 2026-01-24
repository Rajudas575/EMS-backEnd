export const getDaysBetween = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  let count = 0;
  while (start <= end) {
    count++;
    start.setDate(start.getDate() + 1);
  }
  return count;
};
