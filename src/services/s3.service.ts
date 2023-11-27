import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import { UploadedFile } from "express-fileupload";
import * as path from "path";

import { configs } from "../configs/config";
import { EFileTypes } from "../enums";

class S3Service {
  constructor(
    private s3client = new S3Client({
      region: configs.AWS_S3_BUCKET_REGION,
      credentials: {
        accessKeyId: configs.AWS_S3_ACCESS_KEY,
        secretAccessKey: configs.AWS_S3_SECRET_KEY,
      },
    }),
  ) {}

  public async uploadFile(
    file: UploadedFile,
    itemType: EFileTypes.User | EFileTypes.Car,
    itemId: string,
  ) {
    const filePath = this.buildPath(file.name, itemType, itemId);

    await this.s3client.send(
      new PutObjectCommand({
        Key: filePath,
        Bucket: configs.AWS_S3_BUCKET_NAME,
        Body: file.data,
        ContentType: file.mimetype,
        ACL: "public-read",
      }),
    );

    return filePath;
  }

  public async deleteFile(fileKey: string) {
    await this.s3client.send(
      new DeleteObjectCommand({
        Key: fileKey,
        Bucket: configs.AWS_S3_BUCKET_NAME,
      }),
    );
  }

  public buildPath(
    fileName: string,
    itemType: EFileTypes,
    itemId: string,
  ): string {
    return `${itemType}/${itemId}/${crypto.randomUUID()}${path.extname(
      fileName,
    )}`;
  }
}

export const s3Service = new S3Service();
