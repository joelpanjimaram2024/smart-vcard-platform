/// <reference types="vite/client" />

// Declaration merge for vite types to work with bundler resolution
declare module 'vite' {
  import { createServer } from 'vite';
  export { createServer };
}
