import express from "express"
import {getLocations} from "../controller/locations.js";
import {authorizeRoles} from "../middleware/role.js";

const route = express.Router()

route.get("/",authorizeRoles("lab-assistant","instructor"),getLocations)

export default route