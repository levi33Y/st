import { ElMessage } from "element-plus";
import * as XLSX from "xlsx";

export const exportByExcel = (
  tableData: string[][] = [],
  filename?: string,
) => {
  try {
    const sheet = XLSX.utils.aoa_to_sheet(tableData);

    let bookNew = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(bookNew, sheet, filename ?? "document");

    XLSX.writeFile(bookNew, (filename ?? "document") + ".xlsx");
  } catch (err) {
    ElMessage.error("導出失敗");
  }
};
