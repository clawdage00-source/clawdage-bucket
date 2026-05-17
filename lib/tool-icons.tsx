import {
  ClipboardCopy,
  Contact,
  FileArchive,
  FileImage,
  FileSignature,
  IdCard,
  ImageDown,
  Layers,
  QrCode,
  RefreshCw,
  ScanText,
  Table,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import type { ToolIconId } from "@/lib/tools-data";

export const TOOL_ICONS: Record<ToolIconId, LucideIcon> = {
  layers: Layers,
  "file-archive": FileArchive,
  "file-image": FileImage,
  "file-signature": FileSignature,
  "wand-sparkles": WandSparkles,
  table: Table,
  "image-down": ImageDown,
  "refresh-cw": RefreshCw,
  contact: Contact,
  "id-card": IdCard,
  "qr-code": QrCode,
  "scan-text": ScanText,
  clipboard: ClipboardCopy,
};
