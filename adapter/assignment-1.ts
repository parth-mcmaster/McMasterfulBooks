// Pre-Defined Book interface
export interface Book {
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// For multiple filters, all books matching any of them are Listed.
async function listBooks(filters?: Array<{ from?: number; to?: number }>): Promise<Book[]> {
  const baseUrl = 'http://localhost:3000/'; // Since we have used 3000 port by default.
  const url = new URL(baseUrl);

  // Construct query parameters
  if (filters && filters.length > 0) {
    filters.forEach((filter, index) => {
      if (filter.from !== undefined) {
        url.searchParams.append(`filters[${index}][from]`, filter.from.toString());
      }
      if (filter.to !== undefined) {
        url.searchParams.append(`filters[${index}][to]`, filter.to.toString());
      }
    });
  }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
        // Client-side validation.
        throw new Error(`API request failed with status ${response.status}`);
    }
    const books = (await response.json()) as Book[];
    return books;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

const assignment = 'assignment-1';

export default {
  assignment,
  listBooks,
};
