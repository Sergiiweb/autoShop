import { NextFunction, Request, Response } from "express";

import { avatarConfig, photoConfig } from "../configs/file.config";
import { ApiError } from "../errors/api.error";

class FilesMiddleware {
  public async isAvatarValid(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      console.log(req.files);
      if (Array.isArray(req.files.avatar)) {
        throw new ApiError("Avatar must be one single file, not array", 400);
      }

      const { size, mimetype } = req.files.avatar;

      if (size > photoConfig.MAX_SIZE) {
        throw new ApiError("File size is too big, 2Mb allowed", 400);
      }

      if (!photoConfig.MIMETYPES.includes(mimetype)) {
        throw new ApiError("File has invalid format", 400);
      }

      next();
    } catch (e) {
      next(e);
    }
  }

  public async isPhotoValid(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (Array.isArray(req.files.photo)) {
        throw new ApiError("Photo must be one single file, not array", 400);
      }

      const { size, mimetype } = req.files.photo;

      if (size > avatarConfig.MAX_SIZE) {
        throw new ApiError("File size is too big, 3Mb allowed", 400);
      }

      if (!avatarConfig.MIMETYPES.includes(mimetype)) {
        throw new ApiError("File has invalid format", 400);
      }

      next();
    } catch (e) {
      next(e);
    }
  }
}

export const fileMiddleware = new FilesMiddleware();
