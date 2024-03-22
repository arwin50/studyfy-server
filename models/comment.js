import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Posts",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    body: String,
  },
  { timestamps: true }
);

export const Comment = new mongoose.model("Comments", commentSchema);
