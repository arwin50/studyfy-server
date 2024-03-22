import mongoose from "mongoose";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";
import { Comment } from "../models/comment.js";

main()
  .then(() => console.log("Connected to the Database"))
  .catch((err) => console.log("OHNO ERROR!", err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/studyfy");
}

export const comments = [
  {
    postId: "65fd57ffc1d10ed3d460978f",
    author: "65fd57617f3718d6f3e4c6ca",
    body: "I do not know the answer",
  },

  {
    postId: "65fd57ffc1d10ed3d4609794",
    author: "65fd57607f3718d6f3e4c6c7",
    body: "According to the gravity of the earth it is 1000000%!",
  },
  {
    postId: "65fd57ffc1d10ed3d460979c",
    author: "65fd57617f3718d6f3e4c6ce",
    body: "I HATE PAINTING SO NO LITERS OF PAINT FOR HER",
  },
  {
    postId: "65fd3ef23d1f17d840b41c14",
    author: "65fd57617f3718d6f3e4c6cc",
    body: "DAKO NAKA IKAW RAY ANSWER ANA PERO I THINK 1 MELYON!",
  },
];

const generate = async () => {
  try {
    for (let comment of comments) {
      // Create a new comment
      const newComment = await Comment.create(comment);

      // Find the corresponding post by postId
      const post = await Post.findOne({ _id: comment.postId });

      // Find the corresponding user by author id
      const user = await User.findById(comment.author);

      // If the post and user are found, update their comments arrays
      if (post && user) {
        post.comments.push(newComment._id);
        await post.save(); // Save the post document to update the comments array

        await user.save(); // Save the user document to update the comments array
      } else {
        console.log(
          `Post with postId ${comment.postId} or user with id ${comment.author} not found.`
        );
      }
    }
    console.log("Comments created and linked to posts and users successfully.");
  } catch (error) {
    console.error("Error generating comments:", error);
  }
};

generate().then(() => {
  mongoose.connection.close();
});
