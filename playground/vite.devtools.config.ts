import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import annotateDevtools from '../src/vite-devtools'

// The same playground inside Vite DevTools: the Annotate toggle lives in the dock.
export default defineConfig({
  root: import.meta.dirname,
  devtools: { enabled: true },
  plugins: [annotateDevtools(), vue()],
})
