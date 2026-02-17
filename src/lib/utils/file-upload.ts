import { env } from "@/lib/env";

/**
 * File Upload Utilities
 *
 * For S3 or Cloudflare R2
 * Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

// Uncomment when you install aws-sdk
// import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Initialize S3/R2 client
 */
// const s3Client = new S3Client({
//   region: env.S3_REGION || "auto",
//   endpoint: env.S3_ENDPOINT,
//   credentials: {
//     accessKeyId: env.S3_ACCESS_KEY_ID!,
//     secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
//   },
// });

/**
 * Allowed file types and sizes
 */
export const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  documents: ["application/pdf", "application/msword", "text/plain"],
  all: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ],
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
  }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options?.allowedTypes || ALLOWED_FILE_TYPES.all;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not allowed",
    };
  }

  return { valid: true };
}

/**
 * Generate unique file name
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload file to S3/R2
 */
export async function uploadFile(
  file: File,
  folder = "uploads"
): Promise<{ url: string; key: string }> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique file name
  const fileName = generateFileName(file.name);
  const key = `${folder}/${fileName}`;

  // Convert file to buffer
  // Uncomment when you have AWS SDK installed
  // const arrayBuffer = await file.arrayBuffer();
  // const _buffer = Buffer.from(arrayBuffer);

  // Upload to S3/R2
  // Uncomment when you have AWS SDK installed
  // const command = new PutObjectCommand({
  //   Bucket: env.S3_BUCKET_NAME!,
  //   Key: key,
  //   Body: _buffer,
  //   ContentType: file.type,
  // });
  //
  // await s3Client.send(command);

  // Return CDN URL
  const url = `${env.NEXT_PUBLIC_CDN_URL}/${key}`;

  return { url, key };
}

/**
 * Delete file from S3/R2
 */
export async function deleteFile(_key: string): Promise<void> {
  // Uncomment when you have AWS SDK installed
  // const command = new DeleteObjectCommand({
  //   Bucket: env.S3_BUCKET_NAME!,
  //   Key: _key,
  // });
  //
  // await s3Client.send(command);
}

/**
 * Generate presigned URL for direct upload
 * This allows client-side uploads without exposing credentials
 */
export async function generatePresignedUrl(
  _key: string,
  _expiresIn = 3600
): Promise<string> {
  // Uncomment when you have AWS SDK installed
  // const command = new PutObjectCommand({
  //   Bucket: env.S3_BUCKET_NAME!,
  //   Key: key,
  // });
  //
  // return await getSignedUrl(s3Client, command, { expiresIn: _expiresIn });

  return ""; // Placeholder
}

/**
 * API Route Handler for file upload
 *
 * Example usage in app/api/upload/route.ts:
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const user = await requireAuth();
 *     const formData = await request.formData();
 *     const file = formData.get("file") as File;
 *
 *     if (!file) {
 *       return NextResponse.json({ error: "No file provided" }, { status: 400 });
 *     }
 *
 *     const { url, key } = await uploadFile(file, `users/${user.id}`);
 *
 *     return NextResponse.json({ url, key });
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 */
