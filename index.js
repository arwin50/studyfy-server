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

import { Subject } from "./models/subjects.js";
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
      .populate("subject")
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });
    console.log(posts);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/:category/question", async (req, res) => {
  const category = req.params.category;
  console.log(category);
  try {
    const subject = await Subject.findOne({ subjectTitle: category }).populate({
      path: "posts",
      populate: [
        { path: "author" },
        {
          path: "comments",
          populate: { path: "author" },
        },
        { path: "subject" },
      ],
    });

    if (subject) {
      res.json(subject.posts);
    } else {
      console.log("no posts yet");
      res.status(200);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/:category/question/:questionId", async (req, res) => {
  try {
    const postId = req.params.questionId;
    const post = await Post.findById(postId)
      .populate("author")
      .populate("subject")
      .populate({
        path: "comments",
        populate: {
          path: "author",
        },
      });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId)
      .populate({
        path: "posts",
        populate: [ 
        { path: "author"},
        { path: "subject"}
      ]});

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/:category/question/:questionId", async (req, res) => {
  try {
    const postId = req.params.questionId;

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ postId: postId });
    await User.updateMany({}, { $pull: { posts: postId } });
    await Subject.updateMany({}, { $pull: { posts: postId } });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/comment/:commentId", async (req, res) => {
  try {
    const commentId = req.params.commentId;

    await Post.updateMany({}, { $pull: { comments: commentId } });
    await Comment.findByIdAndDelete( commentId );

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/:category/question/:questionId", async (req, res) => {
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
    const { authorId, body, comments, subject } = req.body;
    const author = await User.findById(authorId);

    let subresponse = await Subject.findOne({ subjectTitle: subject });

    if (!subresponse) {
      subresponse = new Subject({
        subjectTitle: subject,
        posts: [],
      });
      await subresponse.save();
    }

    const newPost = new Post({
      author,
      body,
      comments,
      subject: subresponse._id,
    });

    await newPost.save();
    await User.findByIdAndUpdate(author._id, { $push: { posts: newPost._id } });
    await Subject.findByIdAndUpdate(subresponse._id, {
      $push: { posts: newPost._id },
    });

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

app.put("/comment/:commentId", async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const { body, authorId } = req.body;

    const comment = await Comment.findById(commentId).populate("author");

    if (comment) {
      if (comment.author._id != authorId) {
        console.log(comment.author._id);
        return res
          .status(403)
          .json({ error: "You are not authorized to update this post" });
      }

      console.log("hello", comment);
      comment.body = body;
      const updatedComment = await comment.save();

      res
        .status(200)
        .json({ message: "Post updated successfully", post: updatedComment });
    } else {
      res.status(500).json({ message: "Post not found" });
    }
  } catch (error) {
    console.error("Error updating post:", error);
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

app.get("/usermounted", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const user = await User.findById(req.user._id).populate({
        path: "posts",
        populate: [
          { path: "author" },
          {
            path: "comments",
            populate: { path: "author" },
          },
          { path: "subject" },
        ],
      });
      console.log("user", user);
      res.json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
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
