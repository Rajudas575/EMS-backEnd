import numberToWords from "number-to-words";

export const amountInWords = (amount) => {
  if (!amount || isNaN(amount)) return "";
  return `Rupees ${numberToWords.toWords(amount)} Only`;
};
