import express from "express";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/api";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use("/api", apiRoutes);

export default app;