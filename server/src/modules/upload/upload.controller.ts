import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { extname, join } from "path";

/** 上传根目录：服务端进程 cwd 下的 uploads/，DB 仅存返回的 /uploads/xxx 相对 URL */
export const UPLOAD_DIR = join(process.cwd(), "uploads");
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

/**
 * 文件上传接口：POST /upload（multipart/form-data，字段名 file）。
 * 接受图片与 PDF，单文件上限 20MB，落盘到 uploads/ 并以 UUID 重命名，返回可访问的 URL。
 */
@Controller("upload")
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase() || ".png";
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok =
          file.mimetype.startsWith("image/") ||
          file.mimetype === "application/pdf";
        if (!ok) {
          return cb(new BadRequestException("仅支持图片或 PDF 文件"), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file?: { filename: string }) {
    if (!file) throw new BadRequestException("未收到文件");
    return { url: `/uploads/${file.filename}` };
  }
}
