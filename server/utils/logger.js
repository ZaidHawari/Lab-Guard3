import {db} from "../db/connection.js";
import {LogMap} from "../constants/logActions.js";
export const log = async (io,action,userId=null,details={}) => {
    try {
        const result = await db.query(
            `INSERT INTO system_logs (user_id, action, status,details)
             VALUES ($1, $2, $3,$4)
             RETURNING id`,
            [
                userId,
                action.code,
                action.status,
                details
            ]
        )
        const {rows} = await db.query("SELECT name FROM users WHERE id=$1",[userId])
        const user = rows[0]
        const log = {
            id: result.rows[0].id,
            userId,
            user: user?.name,
            action: action.code,
            status: action.status,
            message: LogMap[action.code]?.format(details) || action.code,
            timestamp: new Date(),
        };

        if (io) {
            // Emit realtime logs
            io.to("admins")
                .emit("system_logs", log);
        }
    } catch (err) {
        console.error("Log failed:", err.message)
    }
}