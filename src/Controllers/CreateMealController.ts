import { eq } from 'drizzle-orm';
import { db } from '../db';
import { mealsTable, usersTable } from '../db/schema';
import { HttpResponse, ProtectedHttpRequest } from '../types/Http';
import { badRequest, created, ok } from '../utils/http';
import z from 'zod';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../clients/s3Client';

const schema = z.object({
  fileType: z.enum(['audio/m4a', 'image/jpeg']),
});

export class CreateMealController {
  static async handle({
    userId,
    body,
  }: ProtectedHttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);

    if (!success) {
      return badRequest({ errors: error.issues });
    }

    const fieldId = randomUUID();
    const ext = data.fileType === 'audio/m4a' ? 'm4a' : 'jpg';
    const fileKey = `${fieldId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: fileKey,
    });

    const presignedURL = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    }); 

    const [meal] = await db
      .insert(mealsTable)
      .values({
        userId,
        inputFileKey: fileKey,
        inputType: data.fileType === 'audio/m4a' ? 'audio' : 'picture',
        status: 'uploading',
        icon: '',
        name: '',
        foods: [],
      })
      .returning({ id: mealsTable.id });

    return created({
      mealId: meal.id,
      uploadURL: presignedURL,
    });
  }
}
