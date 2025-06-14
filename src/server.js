import { Router } from "express";
const initRouter = Router();

initRouter.get("/", (_, res) => {
  res.send("Hello World!");
});
export default initRouter;
