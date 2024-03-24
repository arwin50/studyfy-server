import mongoose from "mongoose";
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
    body: String,
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comments",
      },
    ],
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subjects",
    },
  },
  { timestamps: true }
);

export const Post = new mongoose.model("Posts", postSchema);
