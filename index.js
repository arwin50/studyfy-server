import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import GoogleAuth from "passport-google-oauth20";
import { User } from "./models/user.js";
import { Post } from "./models/post.js";
import { Comment } from "./models/comment.js";

const GoogleStrategy = GoogleAuth.Strategy;
import * as dotenv from "dotenv";
import { isLoggedIn } from "./middleware.js";
import e from "express";
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

app.get("/", async (req, res) => {
  try {
    const posts = await Post.find({})
      .populate("author")
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/question/:questionId", async (req, res) => {
  try {
    const postId = req.params.questionId;
    const post = await Post.findById(postId)
      .populate("author")
      .populate("comments");

    const populatedComments = await Promise.all(
      post.comments.map(async (comment) => {
        const populatedComment = await Comment.findById(comment._id).populate(
          "author"
        );
        return populatedComment;
      })
    );

    const populatedPost = {
      _id: post._id,
      author: post.author,
      body: post.body,
      comments: populatedComments,
    };

    console.log(populatedPost);
    res.json(populatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/question/:questionId", async (req, res) => {
  try {
    const postId = req.params.questionId;

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ postId: postId });
    await User.updateMany({}, { $pull: { posts: postId } });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/question/:questionId", async (req, res) => {
  try {
    const postId = req.params.questionId;
    const { body, authorId } = req.body;

    const post = await Post.findById(postId).populate("author");

    if (post) {
      if (post.author._id != authorId) {
        console.log(post.author._id);
        return res
          .status(403)
          .json({ error: "You are not authorized to update this post" });
      }

      console.log("hello", post);
      post.body = body;
      const updatedPost = await post.save();

      res
        .status(200)
        .json({ message: "Post updated successfully", post: updatedPost });
    } else {
      res.status(500).json({ message: "Post not found" });
    }
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/", async (req, res) => {
  try {
    const { authorId, body, comments } = req.body;
    const author = await User.findById(authorId);
    const newPost = new Post({
      author,
      body,
      comments,
    });

    await newPost.save();
    await User.findByIdAndUpdate(author._id, { $push: { posts: newPost._id } });

    res
      .status(201)
      .json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/comments", async (req, res) => {
  try {
    const { postId, author, body } = req.body;

    const post = await Post.findById(postId);
    const user = await User.findById(author);

    const newComment = new Comment({
      postId: post,
      author: user,
      body,
    });

    console.log("data posted whatchuneed", newComment);

    await newComment.save();
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: newComment._id },
    });

    res
      .status(201)
      .json({ message: "Post created successfully", comment: newComment });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

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

app.get("/usermounted", (req, res) => {
  // Check if user is authenticated
  if (req.isAuthenticated()) {
    // User is authenticated, send back user data
    res.json(req.user);
  } else {
    // User is not authenticated, send appropriate response
    res.status(401).json({ message: "User not authenticated" });
  }
});

app.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("http://localhost:5173");
  });
});

app.listen(5000, () => {
  console.log("listening in 4000000000");
});
