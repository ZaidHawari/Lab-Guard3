import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./router/auth.js";
import dashboardRoutes from "./router/dashboard.js";
import equipmentRoutes from "./router/equipment.js";
import transactionsRoute from "./router/transactions.js";
import usersRoute from "./router/users.js";
import logsRoute from "./router/logs.js";
import locationsRoute from "./router/locations.js";
import categoriesRoute from "./router/categories.js";

import { authMiddleware } from "./middleware/auth.js";
import { CheckPasswordChange } from "./middleware/checkPasswordChange.js";
import {getLoginDashboardData} from "./controller/dashboard.js";

const app = express();

app.use(express.json());
app.use(cors());

//public routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard/login",getLoginDashboardData)

//protected routes
app.use("/api", authMiddleware, CheckPasswordChange);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/transactions", transactionsRoute);
app.use("/api/users", usersRoute);
app.use("/api/logs", logsRoute);
app.use("/api/locations", locationsRoute);
app.use("/api/categories", categoriesRoute);

export default app;