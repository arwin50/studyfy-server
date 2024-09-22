import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { setupPassport } from "./auth/GoogleAuth.js";
import { User } from "./models/user.js";
import postRoutes from "./routes/posts.js";
import questionRoutes from "./routes/questions.js";
import userRoutes from "./routes/users.js";
import authRoutes from "./routes/auth.js";

import * as dotenv from "dotenv";
import { Subject } from "./models/subjects.js";
import { Post } from "./models/post.js";
import { Comment } from "./models/comment.js";

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

app.delete("/comment/:commentId", async (req, res) => {
  try {
    const commentId = req.params.commentId;

    await Post.updateMany({}, { $pull: { comments: commentId } });
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate({
      path: "posts",
      populate: [{ path: "author" }, { path: "subject" }],
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

setupPassport();

app.use("/", postRoutes, userRoutes);
app.use("/:category/question", questionRoutes);
app.use("/auth/google", authRoutes);

app.listen(5000, () => {
  console.log("listening in 5000");
});
