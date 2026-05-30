import express from "express";
import {addEquipment, deleteEquipment, getEquipment, updateEquipment} from "../controller/equipment.js";
import {authorizeRoles} from "../middleware/role.js";

const router = express.Router();

router.get("/", getEquipment);
router.post("/",authorizeRoles("lab-assistant","instructor"),addEquipment)
router.patch("/:id",authorizeRoles("lab-assistant"),updateEquipment)
router.delete("/:id",authorizeRoles("lab-assistant"), deleteEquipment);
export default router
