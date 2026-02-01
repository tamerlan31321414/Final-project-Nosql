import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { connectDB } from "./db.js";

const app = createApp();
const port = Number(process.env.PORT || 5000);

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI is missing. Check backend/.env");
  process.exit(1);
}

connectDB(uri)
  .then(() => {
    app.listen(port, () => console.log(`API on ${port}`));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
