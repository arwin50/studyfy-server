import { Post } from "../models/post.js";
import { Comment } from "../models/comment.js";
import { Subject } from "../models/subjects.js";
import { User } from "../models/user.js";


export const getQuestion = async (req, res) => {
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
};

export const deleteQuestion = async (req, res) => {
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
};

export const updateQuestion = async (req, res) => {
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
};

export const postComment = async (req, res) => {
  try {
    const { author, body } = req.body;
    const postId = req.params.questionId;

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
};
