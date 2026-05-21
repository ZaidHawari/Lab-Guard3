import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {db} from "../db/connection.js";
import {log} from "../utils/logger.js";
import {LOG_ACTIONS} from "../constants/logActions.js";

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            error: "Email and password are required"
        });
    }

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
            error: "Invalid field types"
        });
    }
    const emailNormalized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
        return res.status(400).json({error: "Invalid email format"});
    }

    try {
        const {rows} = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [emailNormalized]
        );

        const user = rows[0];

        if (!user) {
            log(req.io,LOG_ACTIONS.LOGIN_FAILED_NO_USER)
            return res.status(401).json({ error: "Wrong email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            log(req.io,LOG_ACTIONS.LOGIN_FAILED_WRONG_PASSWORD)
            return res.status(401).json({ error: "Wrong email or password" });
        }
        const token = jwt.sign(
            { id: user.id, role: user.role},
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        log(req.io,LOG_ACTIONS.LOGIN_SUCCESS,user.id)
        res.json({
            token,
            user: {
                id:                 user.id,
                name:               user.name,
                email:              user.email,
                role:               user.role,
                department:         user.department,
                studentId:          user.student_id,
                imageUrl:           user.image_url || null,
                mustChangePassword: user.must_change_password || false
            }
        });
    } catch (err) {
        console.log(err)
        log(req.io,LOG_ACTIONS.LOGIN_FAILED_SERVER_ERROR)
        res.status(500).json({ error: err.message });
    }
};