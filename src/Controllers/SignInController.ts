import { z } from 'zod';

import { compare } from 'bcryptjs';

import { HttpRequest, HttpResponse } from "../types/Http";
import { badRequest, ok, unathorized } from "../utils/http";
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { signAccessTokenFor } from '../lib/jwt';

const schema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export class SignInController {
  static async handle({ body }: HttpRequest): Promise<HttpResponse> {
    const { success, error, data } = schema.safeParse(body);

    if (!success) {
      return badRequest({ errors: error.issues });
    }

    const user = await db.query.usersTable.findFirst({
          columns: {
            id: true,
            email: true,
            password: true,
          },
          where: eq(usersTable.email, data.email)
        });

    if (!user) {
      return unathorized({ error: 'Invalid credentials.' });
    }

    const isPasswordValid = await compare(data.password, user.password);

    if (!isPasswordValid) {
      return unathorized({ error: 'Invalid credentials.' });
    }

    const accessToken = signAccessTokenFor(user.id);

    return ok({ accessToken });
  }
}