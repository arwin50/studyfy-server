import mongoose from "mongoose";
import { Post } from "../models/post.js";
import { User } from "../models/user.js";

main()
  .then(() => console.log("Connected to the Database"))
  .catch((err) => console.log("OHNO ERROR!", err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/studyfy");
}

export const posts = [
  {
    postId: "132",
    author: "65fd57607f3718d6f3e4c6c7",
    body: "Jenny bought some notebooks for $7 each and some pencils for $3 each. If she spent a total of $31 and bought 4 more notebooks than pencils, how many notebooks did she buy?",
  },

  {
    postId: "1422",
    author: "65fd57617f3718d6f3e4c6ca",
    body: "In a bag, there are 4 red marbles, 3 blue marbles, and 5 green marbles. If you randomly pick two marbles from the bag without replacement, what is the probability of picking one red marble and one green marble?",
  },
  {
    postId: "112",
    author: "65fd57617f3718d6f3e4c6cc",
    body: "Sarah is planning to paint her circular garden. If the garden has a radius of 8 meters and she needs 1 liter of paint to cover 2 square meters, how many liters of paint does she need?",
  },
  {
    postId: "102",
    author: "65fd57617f3718d6f3e4c6ce",
    body: "Jack deposited $5000 into a savings account that earns 3% annual interest, compounded quarterly. If he doesn't make any additional deposits or withdrawals, how much money will be in the account after 5 years?",
  },
];

const generate = async () => {
  try {
    for (let post of posts) {
      // Create a new post
      const newPost = await Post.create(post);

      // Find the corresponding user by their author id
      const user = await User.findById(post.author);

      // If the user is found, push the post id to their posts array
      if (user) {
        user.posts.push(newPost._id);
        await user.save(); // Save the user document to update the posts array
      } else {
        console.log(`User with id ${post.author} not found.`);
      }
    }
    console.log("Posts created and linked to users successfully.");
  } catch (error) {
    console.error("Error generating posts:", error);
  }
};

generate().then(() => {
  mongoose.connection.close();
});
