import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

if (env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
}

export async function uploadImageBuffer(buffer: Buffer, folder: string) {
  if (!env.CLOUDINARY_URL) {
    throw new AppError(503, "Cloudinary is not configured");
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: false
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}
