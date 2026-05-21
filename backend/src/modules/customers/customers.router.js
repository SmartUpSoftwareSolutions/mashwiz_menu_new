import { Router } from "express";
import * as customersController from "./controller/customers.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", auth(), customersController.getCustomers);
router.post("/", auth(), customersController.createCustomer);
router.patch("/:id", auth(), customersController.updateCustomer);
router.delete("/:id", auth(), customersController.deleteCustomer);

export default router;
