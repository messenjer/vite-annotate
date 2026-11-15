import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

import annotate from '../src/vite'

export default defineConfig({
  root: import.meta.dirname,
  // No `root` for the plugin: the notes follow Vite's, `.vite-annotate/` lands in the playground.
  plugins: [annotate(), vue()],
})
