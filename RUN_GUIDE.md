# Run Cafe Connect locally (VS Code)

1. Install Node.js 20+ from https://nodejs.org (check: `node -v`).
2. Open this folder in VS Code (File > Open Folder), then Terminal > New Terminal.
3. `npm install`
4. `npm test`      (pricing unit tests)
5. `npm run dev`   (open the http://localhost:... link it prints)

Pages: / , /menu , /cart , /card (plus /pay/:id and /track/:id after an order).
Ordering needs SUPABASE_SERVICE_ROLE_KEY in the .env file.
