import Koa from 'koa';
import cors from '@koa/cors';
import koaQs from 'koa-qs';
import bodyParser from 'koa-bodyparser';
import createRouter from 'koa-zod-router';
import { z, ZodError } from 'zod';
import { Collection, MongoClient, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';  // For generating unique IDs

const app = new Koa();

// MongoDB connection
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);

let booksCollection: Collection<Book>;

async function connectToDatabase() {
  try {
    await client.connect();
    const database = client.db("bookStore");  // Database name: bookstore
    booksCollection = database.collection("books");  // Collection: books
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
  }
}
connectToDatabase();

// Server-side error handling
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

// Define the Book interface (with optional `id` field)
export interface Book {
  id?: string;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

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

// Define the schema for adding/updating books
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

// GET endpoint: Fetch all books, applying optional price filters
router.get('/', async (ctx) => {
  const parseResult = FilterSchema.safeParse(ctx.request.query);

  if (!parseResult.success) {
    throw parseResult.error;
  }

  const { filters } = parseResult.data;
  let query = {};

  // Apply filters based on price range
  if (filters && filters.length > 0) {
    query = {
      $or: filters.map((filter) => {
        const from = filter.from ?? Number.NEGATIVE_INFINITY;
        const to = filter.to ?? Number.POSITIVE_INFINITY;
        return { price: { $gte: from, $lte: to } };
      }),
    };
  }

  const books = await booksCollection.find(query).toArray();

  // Map `_id` to `id` for older books and remove `_id` from response
  ctx.body = books.map((book) => ({
    ...book,
    id: book.id || book._id.toString(),  // Use `_id` if `id` is missing
    _id: undefined,  // Remove `_id` from the response
  }));
});

// POST endpoint: Add a new book (assign a unique `id` if not provided)
router.post('/book', async (ctx) => {
  const parseResult = BookSchema.safeParse(ctx.request.body);
  if (!parseResult.success) {
    throw parseResult.error;
  }

  const newBook = {
    ...parseResult.data,
    id: uuidv4(),  // Generate a new unique `id`
  };

  await booksCollection.insertOne(newBook);

  ctx.status = 201;  // Created
  ctx.body = { message: 'Book added successfully', book: newBook };
});

// PUT endpoint: Update an existing book by `id`
router.put('/book/:id', async (ctx) => {
  const { id } = ctx.params;
  const parseResult = BookSchema.safeParse(ctx.request.body);
  if (!parseResult.success) {
    throw parseResult.error;
  }

  const updatedBook = parseResult.data;
  const result = await booksCollection.updateOne(
    { _id: new ObjectId(id) },  // Match by MongoDB's `_id`
    { $set: updatedBook }
  );

  if (result.matchedCount === 0) {
    ctx.status = 404;
    ctx.body = { message: 'Book not found' };
  } else {
    ctx.body = { message: 'Book updated successfully', book: updatedBook };
  }
});

// DELETE endpoint: Remove a book by `id`
router.delete('/book/:id', async (ctx) => {
  const { id } = ctx.params;
  const result = await booksCollection.deleteOne({ _id: new ObjectId(id) });

  if (result.deletedCount === 0) {
    ctx.status = 404;
    ctx.body = { message: 'Book not found' };
  } else {
    ctx.body = { message: 'Book removed successfully' };
  }
});

// Use router
app.use(router.routes()).use(router.allowedMethods());

export default app;
