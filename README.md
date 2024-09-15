# McMasterful Books Backend Course

This repository aims to mostly contain the backend code for the McMasterful Books project, developed as part of `[BDV 103:  Advanced JavaScript through Node.JS](https://continuing.mcmaster.ca/courses/bdv-103/)` course @ McMaster. <br></br>

Main tech-stack used in building backend are `Node.js`, `Koa`, and `TypeScript`.


## Getting Started
### Prerequisites
- Node.js version 18 or higher (to use the built-in fetch API without additional dependencies).
- npm (comes with Node.js).
### Installation
1. Clone the repository:<Br>
```git clone https://github.com/parth-mcmaster/McMasterfulBooks```<Br>
```cd McMasterfulBooks```<Br>

2. Install dependencies:<Br>
`npm install`<Br>
3. Start the Server:<Br>
 To start the server, use the following command:<Br>
 `npm run start-server` <Br>
 By default, the server listens on port 3000. If you need to use a different port, pass it as the first argument after the command:
 <Br>
 `npm run start-server 4000`<Br>
 In this example, the server will listen on port 4000.



In first iteration, as part of *Assignment-1* , out of many more to follow - we have covered:


1. **An API to retrieve a list of books with optional filtering based on price ranges.**<Br>\
*API Endpoint*:\
*GET /*\
**Retrieves a list of books, optionally filtered by price ranges.**<Br>\
*Query Parameters*:\
*filters*: **An optional array of price range filters.**\
<Br>
**Each filter is an object with optional from and to properties.
The from and to values represent the minimum and maximum prices (inclusive).
Note: The filters parameter should be passed as query parameters in the URL.**
\
**Example**
\
**Get All Books Above $10**\
GET http://localhost:3000/?filters[0][from]=10 <Br>

2. **A way for front-end to interact with the new API
Assignment Integration:**
When integrating with the front-end or the assignment code (assignment-1.ts), Ensure to update the baseUrl to match the port on which the server is running. (default 3000)
