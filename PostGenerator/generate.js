import mongoose from "mongoose";
import axios from "axios";
import { Post } from "../models/post";

main()
  .then(() => console.log("Connected to the Database"))
  .catch((err) => console.log("OHNO ERROR!", err));

async function main() {
  await mongoose.connect("mongodb://localhost:27017/studyfy");
}

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
  await Post.deleteMany({});
  

};

seedDB().then(() => {
  mongoose.connection.close();
});
