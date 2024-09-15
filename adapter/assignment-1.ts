export interface Book {
    name: string,
    author: string,
    description: string,
    price: number,
    image: string,
};


// If you have multiple filters, a book matching any of them is a match.
async function listBooks(filters?: Array<{from?: number, to?: number}>) : Promise<Book[]>{
    throw new Error("Todo")
}

const assignment = "assignment-1";

export default {
    assignment,
    listBooks
};