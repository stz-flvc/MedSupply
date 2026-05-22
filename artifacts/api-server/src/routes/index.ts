import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import vendorRouter from "./vendor";
import ordersRouter from "./orders";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(vendorRouter);
router.use(ordersRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(messagesRouter);

export default router;
