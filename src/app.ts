import Koa from 'koa';
import cors from '@koa/cors';
import koaQs from 'koa-qs';
import bodyParser from 'koa-bodyparser';
import createRouter from 'koa-zod-router';
import { z, ZodError } from 'zod';
import bookCatalog from '../mcmasteful-book-list.json';

const app = new Koa();

// Server side Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    if (err instanceof ZodError) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid request parameters',
        errors: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      };
    } else {
      console.error('Server Error:', err);
      ctx.status = err.status || 500;
      ctx.body = { message: err.message || 'Internal Server Error' };
    }
  }
});

// Use koa-qs to parse complex query strings
koaQs(app);

// Use middleware
app.use(cors());
app.use(bodyParser());

// Define the Book interface
export interface Book {
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// Load books data from JSON file.
const books = bookCatalog as Book[];

// Define the Filter schema
const FilterSchema = z.object({
  filters: z
    .array(
      z.object({
        from: z.coerce.number().optional(),
        to: z.coerce.number().optional(),
      })
    )
    .optional(),
});

// Creates router
const router = createRouter();

// Defeault endpoint enhanced to apply specific price range filters
router.get('/', async (ctx) => {
  // Validate query parameters
  const parseResult = FilterSchema.safeParse(ctx.request.query);

  if (!parseResult.success) {
    // Validation Error for query parameters
    throw parseResult.error;
  }

  const { filters } = parseResult.data;

  let filteredBooks = books;

  // Apply filters
  if (filters && filters.length > 0) {
    filteredBooks = filteredBooks.filter((book) => {
      return filters.some((filter) => {
        const from = filter.from ?? Number.NEGATIVE_INFINITY;
        const to = filter.to ?? Number.POSITIVE_INFINITY;
        return book.price >= from && book.price <= to;
      });
    });
  }

  // Return the appropriate bookList
  ctx.body = filteredBooks;
});

// Use router
app.use(router.routes()).use(router.allowedMethods());

export default app;
