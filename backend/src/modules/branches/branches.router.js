import { Router } from "express";
import * as branchesController from "./controller/branches.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", branchesController.getBranches);
router.get("/item-codes", branchesController.getItemBranchCodes);
router.post("/", auth(), branchesController.createBranch);
router.patch("/:id", auth(), branchesController.updateBranch);
router.delete("/:id", auth(), branchesController.deleteBranch);

export default router;
