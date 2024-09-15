import app from './app';
import 'dotenv/config';

// Retrieve the port from command-line arguments, if passed.
const argPort = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;

// Determine the port to use
const port = argPort || process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
