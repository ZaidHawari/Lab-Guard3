import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const BRAND_RED = [233, 51, 63];
const DARK = [44, 62, 80];
const GRAY = [100, 116, 139];
const LIGHT_GRAY = [248, 250, 252];
const MID_GRAY = [226, 232, 240];
const WHITE = [255, 255, 255];
const GREEN = [22, 163, 74];
const AMBER = [217, 119, 6];
const BLUE = [37, 99, 235];
const RED_TEXT = [220, 38, 38];

/**
 * Draw a filled rectangle helper
 */
function fillRect(doc, x, y, w, h, color) {
  doc.setFillColor(...color);
  doc.rect(x, y, w, h, 'F');
}

/**
 * Draw a stroked rectangle helper
 */
function strokeRect(doc, x, y, w, h, color, lw = 0.2) {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.rect(x, y, w, h, 'S');
}

/**
 * Export transactions to a properly formatted PDF
 */
export function exportToPDF(transactions, fileName = 'transactions.pdf', title = 'Transaction Report') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const PW = 297; // page width
  const PH = 210; // page height
  const ML = 10;  // margin left
  const MR = 10;  // margin right
  const TW = PW - ML - MR; // table width

  // Column definitions [label, x offset from ML, width]
  const cols = [
    { label: 'Date', x: 0, w: 24 },
    { label: 'Equipment', x: 24, w: 54 },
    { label: 'Type', x: 78, w: 20 },
    { label: 'Status', x: 98, w: 24 },
    { label: 'Student Name', x: 122, w: 40 },
    { label: 'Uni Number', x: 162, w: 26 },
    { label: 'Approved By', x: 188, w: 45 },
    { label: 'Qty', x: 233, w: 14 },
  ];

  const ROW_H = 7;
  const HEAD_H = 8;
  const HEADER_BAND = 26;
  const SUMMARY_BAND = 13;
  const TABLE_START_Y = HEADER_BAND + SUMMARY_BAND + 2;

  let currentPage = 1;

  const drawPageHeader = () => {
    // Red header band
    fillRect(doc, 0, 0, PW, HEADER_BAND, BRAND_RED);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('LabGuard', ML, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Al Hussein Technical University', ML, 17);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(title, PW / 2, 11, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, PW - MR, 11, { align: 'right' });
    doc.text(`Total records: ${transactions.length}`, PW - MR, 17, { align: 'right' });

    // Summary band (dark)
    fillRect(doc, 0, HEADER_BAND, PW, SUMMARY_BAND, DARK);

    const statuses = ['Approved', 'Pending', 'Completed', 'Denied'];
    const bW = PW / statuses.length;
    statuses.forEach((s, i) => {
      const cx = i * bW + bW / 2;
      const n = transactions.filter(t => t.status === s).length;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 190, 200);
      doc.text(s, cx, HEADER_BAND + 5, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...WHITE);
      doc.text(String(n), cx, HEADER_BAND + 11, { align: 'center' });
    });

    // Table column headers
    const hy = TABLE_START_Y;
    fillRect(doc, ML, hy, TW, HEAD_H, DARK);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    cols.forEach(col => {
      const cx = col.label === 'Qty'
        ? ML + col.x + col.w / 2
        : ML + col.x + 2;
      const align = col.label === 'Qty' ? 'center' : 'left';
      doc.text(col.label, cx, hy + 5.2, { align });
    });
  };

  const drawPageFooter = (pageNum, totalPages) => {
    fillRect(doc, 0, PH - 9, PW, 9, LIGHT_GRAY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('LabGuard © Al Hussein Technical University — Confidential', ML, PH - 3.5);
    doc.text(`Page ${pageNum} of ${totalPages}`, PW - MR, PH - 3.5, { align: 'right' });
  };

  // First page
  drawPageHeader();

  let y = TABLE_START_Y + HEAD_H;
  let rowIdx = 0;

  // We'll collect all rows, paginate manually
  const allRows = transactions.map(txn => ({
    date: txn.requestDate ? new Date(txn.requestDate).toLocaleDateString() : '—',
    equipment: String(txn.equipmentName || '—'),
    type: String(txn.type || '—'),
    status: String(txn.status || '—'),
    name: String(txn.userName || txn.user_name || txn.user?.name || txn.student?.name || txn.borrower?.name || '—'),
    studentId: String(txn.studentId || txn.student_id || txn.universityId || txn.university_id || txn.universityNumber || txn.university_number || txn.uniNumber || txn.uni_number || txn.studentNumber || txn.user?.studentId || txn.user?.student_id || txn.user?.universityId || txn.student?.studentId || txn.student?.universityId || 'N/A'),
    approvedBy: txn.approvedBy || '—',
    qty: String(txn.quantity || 0),
  }));

  const USABLE_H = PH - 9 - TABLE_START_Y - HEAD_H; // space per page for rows
  const MAX_ROWS_PER_PAGE = Math.floor(USABLE_H / ROW_H);

  const totalPages = Math.ceil(allRows.length / MAX_ROWS_PER_PAGE) || 1;

  allRows.forEach((row, i) => {
    const pageRow = i % MAX_ROWS_PER_PAGE;

    // New page needed
    if (i > 0 && pageRow === 0) {
      drawPageFooter(currentPage, totalPages);
      doc.addPage();
      currentPage++;
      drawPageHeader();
      y = TABLE_START_Y + HEAD_H;
    }

    // Alternating row background
    if (pageRow % 2 === 1) {
      fillRect(doc, ML, y, TW, ROW_H, LIGHT_GRAY);
    } else {
      fillRect(doc, ML, y, TW, ROW_H, WHITE);
    }

    // Row border
    strokeRect(doc, ML, y, TW, ROW_H, MID_GRAY, 0.1);

    // Status color
    const statusColor = {
      Approved: GREEN,
      Pending: AMBER,
      Completed: BLUE,
      Denied: RED_TEXT,
    }[row.status] || GRAY;

    doc.setFontSize(8);

    const cellValues = [
      { text: row.date, idx: 0, color: GRAY, bold: false },
      { text: row.equipment, idx: 1, color: DARK, bold: true },
      { text: row.type, idx: 2, color: GRAY, bold: false },
      { text: row.status, idx: 3, color: statusColor, bold: true },
      { text: row.name, idx: 4, color: DARK, bold: false },
      { text: row.studentId, idx: 5, color: GRAY, bold: false },
      { text: row.approvedBy, idx: 6, color: GRAY, bold: false },
      { text: row.qty, idx: 7, color: DARK, bold: true, center: true },
    ];

    cellValues.forEach(({ text, idx, color, bold, center }) => {
      const col = cols[idx];
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...color);

      // Truncate text to fit column width
      const maxW = col.w - 3;
      let display = text;
      while (doc.getTextWidth(display) > maxW && display.length > 3) {
        display = display.slice(0, -4) + '…';
      }

      const tx = center
        ? ML + col.x + col.w / 2
        : ML + col.x + 2;
      doc.text(display, tx, y + 4.7, { align: center ? 'center' : 'left' });
    });

    y += ROW_H;
    rowIdx++;
  });

  // Empty state
  if (allRows.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.text('No transactions to display.', PW / 2, TABLE_START_Y + HEAD_H + 20, { align: 'center' });
  }

  drawPageFooter(currentPage, totalPages);
  doc.save(fileName);
}

/**
 * Export transactions to Excel with all columns
 */
export function exportToExcel(transactions, fileName = 'transactions.xlsx', title = 'Transaction Report') {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Date', 'Equipment', 'Type', 'Status',
    'Student Name', 'Uni Number', 'Quantity', 'Purpose',
    'Expected Return', 'Approved By',
  ];

  const rows = transactions.map(txn => [
    txn.requestDate ? new Date(txn.requestDate).toLocaleDateString() : 'N/A',
    txn.equipmentName || txn.equipment_name || txn.equipment?.name || 'N/A',
    txn.type || 'N/A',
    txn.status || 'N/A',
    txn.userName || txn.user_name || txn.user?.name || txn.student?.name || 'N/A',
    txn.studentId || txn.student_id || txn.universityId || txn.university_id || txn.universityNumber || txn.university_number || txn.uniNumber || txn.uni_number || txn.studentNumber || txn.user?.studentId || txn.user?.student_id || txn.user?.universityId || txn.student?.studentId || txn.student?.universityId || 'N/A',
    txn.quantity || 0,
    txn.purpose || 'N/A',
    txn.expectedReturnDate || txn.expected_return_date || txn.dueDate
      ? new Date(txn.expectedReturnDate || txn.expected_return_date || txn.dueDate).toLocaleDateString()
      : 'N/A',
    txn.approvedBy || txn.approved_by || txn.approvedByName || 'N/A',
  ]);

  const titleRow = [title];
  const metaRow = [`Generated: ${new Date().toLocaleString()} | Total: ${transactions.length} records`];
  const blankRow = [];

  const ws = XLSX.utils.aoa_to_sheet([titleRow, metaRow, blankRow, headers, ...rows]);

  ws['!cols'] = [
    { wch: 14 }, { wch: 36 }, { wch: 12 }, { wch: 12 },
    { wch: 22 }, { wch: 16 }, { wch: 10 }, { wch: 40 },
    { wch: 18 }, { wch: 24 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, fileName);
}
