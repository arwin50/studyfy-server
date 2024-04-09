import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { setupPassport } from "./auth/GoogleAuth.js";
import postRoutes from "./routes/posts.js";
import questionRoutes from "./routes/questions.js";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js"

import * as dotenv from "dotenv";

dotenv.config();
const dbUrl = process.env.MONGO_DB_API_KEY;

main()
  .then(() => console.log("Connected to the Database"))
  .catch((err) => console.log("OHNO ERROR!", err));

async function main() {
  await mongoose.connect(dbUrl);
}

const app = express();
const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(express.json());
app.use(cors(corsOptions));
app.use(
  session({
    secret: "lols",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

setupPassport();

app.use("/", postRoutes, userRoutes);
app.use("/:category/question", questionRoutes);
app.use("/auth/google",authRoutes)



app.listen(5000, () => {
  console.log("listening in 5000");
});
