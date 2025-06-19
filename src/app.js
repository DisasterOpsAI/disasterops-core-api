import express from "express";
import initRouter from "./server.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/", initRouter);

const server = app.listen(PORT, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`App listening at http://${host}:${port}`);
});
