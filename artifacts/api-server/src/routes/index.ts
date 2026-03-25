import { Router, type IRouter } from "express";
import healthRouter from "./health";
import edwardRouter from "./edward";

const router: IRouter = Router();

router.use(healthRouter);
router.use(edwardRouter);

export default router;
