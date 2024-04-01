import { Post } from "../models/post";
import { Comment } from "../models/comment";
import { Subject } from "../models/subjects";
import { User } from "../models/user";

export const postComment = async (req, res) => {
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
};

export const postPost = async (req, res) => {
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
};

export const getPosts = async (req, res) => {
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
};
