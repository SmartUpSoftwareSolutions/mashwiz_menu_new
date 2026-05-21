import { Router } from "express";
import * as itemsController from "./controller/items.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/branches", itemsController.getBranches);
router.get("/items", itemsController.getMenuItems);
router.get("/admin-items", auth(), itemsController.getAdminItems);
router.get("/admin-categories", auth(), itemsController.getAdminCategories);
router.post("/items", auth(), itemsController.createMenuItem);
router.patch("/items/:itm_code", auth(), itemsController.updateMenuItem);
router.delete("/items/:itm_code", auth(), itemsController.deleteMenuItem);

router.get("/categories/all", itemsController.getAllCategories);
router.get("/categories", itemsController.getParentCategories);
router.get("/categories/:parentId", itemsController.getSubCategories);
router.post("/categories", auth(), itemsController.createCategory);
router.patch("/categories/:itm_group_code", auth(), itemsController.updateCategory);
router.delete("/categories/:itm_group_code", auth(), itemsController.deleteCategory);

export default router;
