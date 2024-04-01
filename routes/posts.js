import express from "express";
const router = express.Router();
import * as postController from "../controllers/posts.js";

router.route("/comments").get(postController.getPosts).post(postController.postComment).post();
