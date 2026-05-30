import express from "express";
import {
    getStudentDashboardData,
    getLabAssistantDashboardData,
    getAdminDashboardData,
    getInstructorDashboardData, getLoginDashboardData
} from "../controller/dashboard.js";
import {authorizeRoles} from "../middleware/role.js";

const router = express.Router();
router.get("/login", getLoginDashboardData); // public
router.get("/student", getStudentDashboardData);
router.get("/lab-assistant",authorizeRoles("lab-assistant"),getLabAssistantDashboardData)
router.get("/instructor",authorizeRoles("instructor"),getInstructorDashboardData)
router.get("/admin",authorizeRoles("admin"),getAdminDashboardData)
export default router;