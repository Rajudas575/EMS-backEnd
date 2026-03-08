export const calculateProfessionalTax = (grossSalary) => {
  if (grossSalary <= 10000) return 0;
  if (grossSalary <= 15000) return 110;
  if (grossSalary <= 25000) return 130;
  if (grossSalary <= 40000) return 150;
  return 200;
};
