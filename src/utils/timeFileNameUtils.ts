export const getTimeFileName = (date: Date = new Date()) => {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  // Windows 文件名不允许 ":" 等字符，因此用纯数字与下划线
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

