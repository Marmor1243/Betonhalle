import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      // WIP-Audiodateien (z.B. aus einer DAW exportiert) landen manchmal kurz
      // gesperrt im Projektordner, während sie noch geschrieben werden. Das
      // bringt Vites Datei-Watcher zum Absturz (EBUSY). Fertige Assets gehören
      // ohnehin nach public/ - alles andere an Audiodateien wird ignoriert.
      ignored: (file) => /\.(mp3|wav|flac|aif?f|m4a|ogg)$/i.test(file) && !file.replace(/\\/g, '/').includes('/public/')
    }
  }
});
