import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    middlewareMode: false,
    configureMiddleware: (app) => {
      app.use((req, res, next) => {
        try {
          decodeURI(req.url);
          next();
        } catch (err) {
          console.error("❌ Malformed URI:", req.url);
          res.writeHead(400);
          res.end("Bad request: malformed URI");
        }
      });
    },
  },
});
