import Koa from 'koa';
import cors from '@koa/cors';
import koaQs from 'koa-qs';
import bodyParser from 'koa-bodyparser';
import createRouter from 'koa-zod-router';
import { z, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';  // Use UUIDs for book IDs
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

// Define the Book interface with an optional id
export interface Book {
  id?: string;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// Load books data from JSON file, assigning IDs if not already present
let books: Book[] = (bookCatalog as Book[]).map((book) => ({
  ...book,
  id: book.id || uuidv4(),  // Ensure every book has a unique id
}));

// Define the Filter schema for query parameters
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

// Define the schema for adding/updating books, now with `id`
const BookSchema = z.object({
  id: z.string().optional(),  // Optional for adding, required for updating
  name: z.string(),
  author: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string(),
});

// Creates router
const router = createRouter();

// Get endpoint to filter books by price range
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

  // Return the appropriate book list
  ctx.body = filteredBooks;
});

// POST endpoint to add a new book
router.post('/book', async (ctx) => {
  const parseResult = BookSchema.safeParse(ctx.request.body);
  if (!parseResult.success) {
    throw parseResult.error;
  }

  const newBook = { ...parseResult.data, id: uuidv4() };  // Assign a unique ID
  books.push(newBook);
  ctx.status = 201;  // Created
  ctx.body = { message: 'Book added successfully', book: newBook };
});

// PUT endpoint to update an existing book by ID
router.put('/book/:id', async (ctx) => {
  const { id } = ctx.params;
  const parseResult = BookSchema.safeParse(ctx.request.body);
  if (!parseResult.success) {
    throw parseResult.error;
  }

  const updatedBook = parseResult.data;
  const bookIndex = books.findIndex((book) => book.id === id);

  if (bookIndex !== -1) {
    books[bookIndex] = { ...updatedBook, id };  // Ensure the ID is not changed
    ctx.body = { message: 'Book updated successfully', book: books[bookIndex] };
  } else {
    ctx.status = 404;
    ctx.body = { message: 'Book not found' };
  }
});

// DELETE endpoint to remove a book by ID
router.delete('/book/:id', async (ctx) => {
  const { id } = ctx.params;
  const bookIndex = books.findIndex((book) => book.id === id);

  if (bookIndex !== -1) {
    books.splice(bookIndex, 1);
    ctx.body = { message: 'Book removed successfully' };
  } else {
    ctx.status = 404;
    ctx.body = { message: 'Book not found' };
  }
});

// Use router
app.use(router.routes()).use(router.allowedMethods());

export default app;
