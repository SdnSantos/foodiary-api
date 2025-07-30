import { eq } from 'drizzle-orm';
import { db } from '../db';
import { mealsTable } from './../db/schema';

export class ProcessMeal {
  static async process({ fileKey }: { fileKey: string }) {
    const meal = await db.query.mealsTable.findFirst({
      where: eq(mealsTable.inputFileKey, fileKey),
    });

    if (!meal) {
      throw new Error('Meal not found.');
    }

    if (meal.status === 'failed' || meal.status === 'success') {
      return;
    }

    await db.update(mealsTable).set({ status: 'processing' });

    try {
      await db
        .update(mealsTable)
        .set({
          status: 'success',
          name: 'Café da manhã',
          icon: '',
          foods: [
            {
              name: 'pão',
              quantity: '2 fatias',
              calories: 100,
              proteins: 200,
              carbohydrates: 300,
              fats: 400,
            },
          ],
        })
        .where(eq(mealsTable.id, meal.id));
    } catch {
      await db
        .update(mealsTable)
        .set({
          status: 'failed',
        })
        .where(eq(mealsTable.id, meal.id));
    }
  }
}
