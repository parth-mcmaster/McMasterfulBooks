import assignment1 from "./assignment-1";

export type BookID = string;

export interface Book {
  id?: BookID;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

async function listBooks(filters?: Array<{ from?: number; to?: number }>): Promise<Book[]> {
  return assignment1.listBooks(filters);
}

// Function to create a new book or update an existing one
async function createOrUpdateBook(book: Book): Promise<BookID> {
  if (book.id) {
    // Update the existing book
    const response = await fetch(`/book/${book.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    });

    if (!response.ok) {
      throw new Error("Failed to update book");
    }

    const updatedBook: Book = await response.json() as Book;
    return updatedBook.id!;
  } else {
    // Create a new book
    const response = await fetch(`/book`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(book),
    });

    if (!response.ok) {
      throw new Error("Failed to create book");
    }

    const newBook: Book = await response.json() as Book;
    return newBook.id!;
  }
}

// Function to remove a book by ID
async function removeBook(bookId: BookID): Promise<void> {
  const response = await fetch(`/book/${bookId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete book");
  }
}

const assignment = "assignment-2";

export default {
  assignment,
  createOrUpdateBook,
  removeBook,
  listBooks,
};
