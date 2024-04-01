import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import GoogleAuth from "passport-google-oauth20";
import { User } from "./models/user.js";
import postRoutes from "./routes/posts.js";
import questionRoutes from "./routes/questions.js";
import userRoutes from "./routes/users.js";

const GoogleStrategy = GoogleAuth.Strategy;
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async function (accessToken, refreshToken, profile, done) {
      console.log("profile", profile);
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
          });

          await user.save();
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use("/", postRoutes, userRoutes);
app.use("/:category/question", questionRoutes);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/",
    successRedirect: "http://localhost:5173/",
  }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.listen(5000, () => {
  console.log("listening in 4000000000");
});
