import express from "express";
const router = express.Router();
import * as questionController from "../controllers/question.js";

router.route("/").get(questionController.getCategoryQuestion);
router
  .route("/:questionId")
  .get(questionController.getQuestion)
  .delete(questionController.deleteQuestion)
  .put(questionController.updateQuestion);
router.route("/:questionId/comments").post(questionController.postComment);

export default router;
