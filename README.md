# INF653 - US States REST API

Final project for INF653 Back End Web Development. A Node.js + Express + MongoDB
REST API serving data for all 50 US states, with user-contributed fun facts
stored in MongoDB.

## Stack

- Node.js (>=18) / Express 4
- Mongoose / MongoDB Atlas
- dotenv, cors

## Project structure

```
.
├── server.js                  # Express entry point
├── package.json
├── .env.example               # template (copy to .env locally)
├── .gitignore
├── seed.js                    # one-time DB seed for KS, MO, OK, NE, CO
├── config/
│   └── dbConn.js              # Mongoose connection
├── controllers/
│   └── statesController.js    # all route handlers
├── middleware/
│   └── verifyStates.js        # validates :state URL param
├── model/
│   └── States.js              # Mongoose schema
├── models/
│   └── statesData.json        # source data for all 50 states
├── routes/
│   └── states.js              # /states/* router
├── public/
│   └── index.html             # root landing page
└── views/
    └── 404.html               # 404 fallback for HTML clients
```

## Setup (local)

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DATABASE_URI` with your MongoDB
   Atlas connection string. **Do not commit `.env`.**
3. (Optional) Run `node seed.js` once to populate Kansas, Missouri, Oklahoma,
   Nebraska, and Colorado with starter fun facts.
4. `npm start` &mdash; server runs on `http://localhost:3500`.

## Deployment

This project deploys cleanly to Glitch, Render, or any Node.js host:

- Push the repository to GitHub.
- On Glitch: import from GitHub, then add `DATABASE_URI` as an environment
  variable in the Glitch project editor (`.env` panel).
- On Render: connect the GitHub repo, set the start command to `node server.js`,
  and add `DATABASE_URI` as an environment variable. Render assigns `PORT`
  automatically.

The `.env` file is **never** committed - Glitch/Render inject env vars at
runtime.

## API endpoints

### GET

| Endpoint                          | Response                                                          |
|-----------------------------------|-------------------------------------------------------------------|
| `/states/`                        | All state data, with funfacts merged in                           |
| `/states/?contig=true`            | Contiguous states only (excludes AK, HI)                          |
| `/states/?contig=false`           | Non-contiguous (AK, HI only)                                      |
| `/states/:state`                  | Full data for one state                                           |
| `/states/:state/funfact`          | One random fun fact, or a "no fun facts" message                  |
| `/states/:state/capital`          | `{ state, capital }`                                              |
| `/states/:state/nickname`         | `{ state, nickname }`                                             |
| `/states/:state/population`       | `{ state, population }`                                           |
| `/states/:state/admission`        | `{ state, admitted }`                                             |

`:state` accepts 2-letter codes in any case (`ks`, `KS`, `Ks` all work).
Full names (e.g. `Kansas`) and unknown codes return a 400 with
`{ message: "Invalid state abbreviation parameter" }`.

### POST `/states/:state/funfact`

Body:
```json
{ "funfacts": ["fact 1", "fact 2"] }
```
Appends to the existing array, or creates a new record if none exists.

### PATCH `/states/:state/funfact`

Body:
```json
{ "index": 1, "funfact": "replacement text" }
```
`index` is **1-based** (1 means the first element of the array).

### DELETE `/states/:state/funfact`

Body:
```json
{ "index": 1 }
```
Removes the element at the given 1-based index using `filter()` so no holes
are left in the array.

### 404 fallback

Any unknown route returns a 404. The response is either an HTML page or
`{ "error": "404 Not Found" }` JSON depending on the request's `Accept` header.
