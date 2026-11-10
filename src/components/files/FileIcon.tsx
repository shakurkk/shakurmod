import {
  FileArchive,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File as FileGeneric,
  Smartphone,
  Cpu,
  FileType2,
} from "lucide-react";
import { kindOf, type FileKind } from "@/lib/file-types";
import { cn } from "@/lib/utils";

const ICONS: Record<FileKind, typeof FileGeneric> = {
  apk: Smartphone,
  archive: FileArchive,
  pdf: FileType2,
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  doc: FileText,
  program: Cpu,
  other: FileGeneric,
};

export const KIND_TEXT: Record<FileKind, string> = {
  apk: "text-kind-apk",
  archive: "text-kind-archive",
  pdf: "text-kind-pdf",
  image: "text-kind-image",
  video: "text-kind-video",
  audio: "text-kind-audio",
  doc: "text-kind-doc",
  program: "text-kind-program",
  other: "text-kind-other",
};

export const KIND_BG: Record<FileKind, string> = {
  apk: "bg-kind-apk/10",
  archive: "bg-kind-archive/12",
  pdf: "bg-kind-pdf/10",
  image: "bg-kind-image/10",
  video: "bg-kind-video/10",
  audio: "bg-kind-audio/10",
  doc: "bg-kind-doc/10",
  program: "bg-kind-program/10",
  other: "bg-kind-other/10",
};

export function FileIcon({ ext, className }: { ext: string; className?: string }) {
  const kind = kindOf(ext);
  const Icon = ICONS[kind];
  return <Icon className={cn("h-5 w-5 shrink-0", KIND_TEXT[kind], className)} aria-hidden="true" />;
}
