import { z } from 'zod';

import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, conflict, created } from "../utils/http";
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

import { usersTable } from '../db/schema';
import { signAccessTokenFor } from '../lib/jwt';

const schema = z.object({
  goal: z.enum(['lose', 'maintain', 'gain']),
  gender: z.enum(['male', 'female']),
  birthDate: z.iso.date(),
  height: z.number(),
  weight: z.number(),
  activityLevel: z.number().min(1).max(5),
  account: z.object({
    name: z.string(),
    email: z.email(),
    password: z.string().min(8),
  }),  
});

export class SignUpController {
  static async handle({ body }: HttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);

    if (!success) {
      return badRequest({ errors: error.issues })
    }

    const userAlreadyExists = await db.query.usersTable.findFirst({
      columns: {
        email: true
      },
      where: eq(usersTable.email, data.account.email)
    })

    if (userAlreadyExists) {
      return conflict({ error: 'This email is already in use.'})
    }

    const hashedPassword = await hash(data.account.password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({
        ...data,
        ...data.account,
        password: hashedPassword,
        calories: 0,
        carbohydrates: 0,
        fats: 0,
        proteins: 0,
    }).returning({
      id: usersTable.id,
    })

    const accessToken = signAccessTokenFor(user.id);

    return created({ accessToken });
    }
  }