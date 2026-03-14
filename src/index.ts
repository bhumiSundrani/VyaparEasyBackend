import dotenv from "dotenv"
import express from 'express';
import dbConnect from './lib/dbConnect';
import cors from "cors"
import cookieParser from "cookie-parser"
import { Router } from "express";
import routes from "./routes"

dotenv.config({path: "./.env.local"})

import { env } from "./config/env";

const {NEXT_BASE_URL, PORT}  = env

const app = express();

app.use(cors(
  {
    origin: NEXT_BASE_URL,
    credentials: true
  }
))
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use("/api", routes)

const port = PORT || 3000;


async function startServer() {
  try {
    await dbConnect();
    app.listen(port, () => {
      console.log(`Express is listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to connect DB", error);
    process.exit(1);
  }
}

startServer();
