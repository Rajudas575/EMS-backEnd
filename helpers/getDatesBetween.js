export const getDatesBetween = (start, end) => {
  const dates = [];
  let current = new Date(start);

  while (current <= new Date(end)) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};
