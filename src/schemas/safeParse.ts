import { z } from 'zod';

/**
 * Parse data with a Zod schema, logging detailed errors to console on failure.
 * This makes it easier to debug API response mismatches.
 */
export function safeParse<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context?: string
): z.infer<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const contextStr = context ? ` [${context}]` : '';
    console.error(`[Zod]${contextStr} Schema validation failed:`);
    console.error(
      '[Zod] Errors:',
      JSON.stringify(result.error.issues, null, 2)
    );
    console.error('[Zod] Received data:', JSON.stringify(data, null, 2));

    throw result.error;
  }

  return result.data;
}
