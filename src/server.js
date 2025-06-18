import { Router } from "express";
import FirebaseRealtimeStore from "./FirebaseRealtimeStore.js";

const store = new FirebaseRealtimeStore("api/testing", { createdBy: "Thilina" });

const initRouter = Router();

initRouter.get("/", (_, res) => {
  res.send("Hello World!");
});

initRouter.post("/firebase-testing", async (req, res) => {
  const { method, path, data } = req.body;

  try {
    switch (method) {
      case "create":
        await store.create(path, data);
        return res.status(201).send({ message: `Created at ${path}`, details: data });

      case "read":
        const result = await store.read(path);
        return res.status(200).send(result);

      case "update":
        await store.update(path, data);
        return res.status(200).send({ message: `Updated ${path}`, details: data });

      case "delete":
        await store.delete(path);
        return res.status(200).send({ message: `Deleted ${path}` });

      default:
        return res.status(400).send({ error: "Unknown method" });
    }
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});

export default initRouter;
