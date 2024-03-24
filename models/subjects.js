import mongoose from "mongoose";
const Schema = mongoose.Schema;

const subjectSchema = new Schema(
  {
    subjectTitle: String,
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Posts",
      },
    ],
  },
  { timestamps: true }
);

export const Subject = new mongoose.model("Subjects", subjectSchema);
