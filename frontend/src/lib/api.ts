// API client layer. Frontend-only demo uses `mock-store` (localStorage).
// To wire up your MERN backend, set VITE_API_URL and replace mock calls with
// fetch() to your Express endpoints, e.g.:
//   const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cards`, {...})
// The types in `mock-store.ts` mirror what your API should return.
export * from "./mock-store";
