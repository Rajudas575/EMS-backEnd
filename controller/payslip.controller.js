import PDFDocument from "pdfkit";
import Payroll from "../models/payroll.model.js";
import User from "../models/users.model.js";
import { amountInWords } from "../helpers/amountInWords.js";
import path from "path";
import { fileURLToPath } from "url";
import { getMonthName } from "../helpers/getMonthName.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadPayslip = async (req, res) => {
  try {
    const monthNum = Number(req.params.month);
    const yearNum = Number(req.params.year);

    if (
      Number.isNaN(monthNum) ||
      Number.isNaN(yearNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return res.status(400).json({ message: "Invalid month or year" });
    }

    const monthName = getMonthName(monthNum);
    const userId = req.user.id;

    const payroll = await Payroll.findOne({
      userId,
      month: monthNum,
      year: yearNum,
    });

    if (!payroll) {
      return res.status(404).json({ message: "Payslip not generated" });
    }

    const user = await User.findById(userId).populate(
      "category_id",
      "category",
    );

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payslip-${monthName}-${yearNum}.pdf`,
    );
    res.setHeader("Content-Type", "application/pdf");

    doc.pipe(res);

    const fontPath = path.join(__dirname, "../assets/fonts/Roboto-Regular.ttf");
    doc.font(fontPath);

    /* ---------------- LOGO WATERMARK ---------------- */
    const drawLogoWatermark = () => {
      const watermarkPath = path.join(__dirname, "../assets/logo/logo.png");
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      const size = 320;
      const x = (pageWidth - size) / 2;
      const y = (pageHeight - size) / 4;

      doc.save();
      doc.opacity(0.09);
      doc.rotate(-28, { origin: [pageWidth / 2, pageHeight / 2] });
      doc.image(watermarkPath, x, y, { width: size });
      doc.restore();
    };

    drawLogoWatermark();
    doc.on("pageAdded", drawLogoWatermark);

    /* ---------------- HEADER ---------------- */
    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown(0.5);

    // Logo (centered)
    const logoPath = path.join(__dirname, "../assets/logo/logo.png");
    const pageWidth = doc.page.width;
    const logoWidth = 20;
    const logoX = (pageWidth - logoWidth) / 2;

    doc.image(logoPath, logoX, doc.y, { width: logoWidth });
    doc.moveDown(1);

    // Company address (centered)
    doc
      .fontSize(10)
      .text("Panihati", { align: "center" })
      .text("1501 Nilgunj Road", { align: "center" })
      .text("Gateway Avenue", { align: "center" });

    doc.moveDown(2);

    /* ---------------- EMPLOYEE DETAILS ---------------- */
    const leftX = 40;
    const rightX = 400;
    let y = doc.y;

    doc.fontSize(10);
    doc.text(
      `Date of Joining : ${new Date(user.createdAt).toLocaleDateString() || "N/A"}`,
      leftX,
      y,
    );
    doc.text(`Employee Name : ${user.name}`, rightX, y);

    y += 15;
    //FIXED: use monthName and yearNum instead of undefined month/year
    doc.text(`Pay Period : ${monthName} - ${yearNum}`, leftX, y);
    doc.text(`Designation : ${user.designation || "Employee"}`, rightX, y);

    y += 15;
    doc.text(`Worked Days : ${payroll.workingDays}`, leftX, y);
    doc.text(`Department : ${user.category_id?.category}`, rightX, y);

    const leaveData = payroll.leaveBreakup || {};
    y += 15;
    doc.text(`Present Days : ${payroll.presentDays || 0}`, leftX, y);
    doc.text(`Casual Leave (CL) : ${payroll.paidLeaves}`, rightX, y);

    y += 15;
    doc.text(`Sick Leave (SL)   : ${leaveData.SL || 0} `, leftX, y);
    doc.text(`Loss of Pay  Leave(LOP) : ${leaveData.LOP || 0} `, rightX, y);

    doc.moveDown(2);

    /* ---------------- TABLE HEADER ---------------- */
    const tableTop = doc.y;
    const col1 = 40;
    const col11 = 150;
    const col2 = 200;
    const col22 = 300;
    const col3 = 340;
    const col33 = 440;
    const col4 = 480;

    doc.rect(40, tableTop, 520, 20).stroke();
    doc.fontSize(10).text("Earnings", col1 + 5, tableTop + 5);
    doc.text("Amount", col2 + 5, tableTop + 5);
    doc.text("Deductions", col3 + 5, tableTop + 5);
    doc.text("Amount", col4 + 5, tableTop + 5);

    /* ---------------- TABLE ROWS ---------------- */
    const rows = [
      ["Basic", payroll.basicSalary, "Provident Fund", payroll.pf || 0],
      [
        "Incentive Pay",
        payroll.incentive || 0,
        "Professional Tax",
        payroll.professionalTax || 0,
      ],
      [
        "House Rent Allowance",
        payroll.hra,
        "LOP days Deduction ",
        payroll.lopDeduction || 0,
      ],
      ["Meal Allowance", payroll.allowance, "", ""],
    ];

    let rowY = tableTop + 20;

    rows.forEach((row) => {
      doc.rect(40, rowY, 520, 20).stroke();
      doc.text(row[0], col1 + 5, rowY + 5);
      doc.text(row[1], col2 + 5, rowY + 5);
      doc.text(row[2], col3 + 5, rowY + 5);
      doc.text(row[3], col4 + 5, rowY + 5);
      rowY += 20;
    });

    /* ---------------- TOTALS ---------------- */
    const totalDeductions = payroll.lopDeduction + payroll.professionalTax;

    doc.rect(40, rowY, 520, 20).stroke();
    doc.text("Total Earnings", col1 + 5, rowY + 5);
    doc.text(payroll.grossSalary, col2 + 5, rowY + 5);
    doc.text("Total Deductions", col3 + 5, rowY + 5);
    doc.text(totalDeductions, col4 + 5, rowY + 5);

    rowY += 30;

    /* ---------------- NET PAY ---------------- */
    doc.fontSize(11).text(`Net Pay : ₹${payroll.netSalary}`, col33, rowY);
    rowY += 40;
    doc.moveDown(3);
    doc.fontSize(10).text(`(${amountInWords(payroll.netSalary)})`, col22, rowY);
    rowY += 30;

    doc.moveDown(3);

    /* ---------------- SIGNATURE ---------------- */
    doc
      .fontSize(9)
      .text(
        "***This is system generated payslip signature not required***",
        col11 + 10,
        rowY + 15,
      );

    doc.end();
  } catch (error) {
    console.error("PAYSLIP ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
