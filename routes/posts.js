import express from "express";
const router = express.Router();
import * as postController from "../controllers/posts.js";

router.route("/").get(postController.getPosts).post(postController.postPost);
router.route("/:category/question").get(postController.getCategoryQuestion);

export default router;
