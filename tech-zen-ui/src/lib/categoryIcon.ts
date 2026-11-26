import {
  Cpu,
  MemoryStick,
  HardDrive,
  Package,
  CircuitBoard,
  Monitor,
  Laptop,
  Mouse,
  Keyboard,
  PcCase,
  type LucideIcon,
} from "lucide-react";

// Icon theo tên danh mục (id thay đổi mỗi lần seed lại DB nên không map theo id)
export const categoryIconFor = (name: string): LucideIcon => {
  const n = name.toLowerCase();
  if (n.includes("cpu") || n.includes("vi xử lý")) return Cpu;
  if (n.includes("ram") || n.includes("bộ nhớ")) return MemoryStick;
  if (n.includes("vga") || n.includes("card") || n.includes("mainboard") || n.includes("bo mạch")) return CircuitBoard;
  if (n.includes("ổ cứng") || n.includes("ssd") || n.includes("hdd")) return HardDrive;
  if (n.includes("màn hình")) return Monitor;
  if (n.includes("laptop")) return Laptop;
  if (n.includes("chuột")) return Mouse;
  if (n.includes("bàn phím")) return Keyboard;
  if (n === "pc" || n.startsWith("pc ") || n.includes("máy bộ")) return PcCase;
  return Package;
};
