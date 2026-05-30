import { db } from "../db/connection.js";
import camelcaseKeys from "camelcase-keys";
import { parseLimit } from "../utils/queryHelpers.js"
import {sendNotification, sendNotificationToUsers} from "../utils/notifications.js";
import {NOTIFICATION_TYPES} from "../constants/notificationTypes.js";
import {EQUIPMENT_STATUS} from "../constants/equipmentStatus.js";
import {LOG_ACTIONS} from "../constants/logActions.js";
import {log} from "../utils/logger.js";
import {TRANSACTION_STATUS} from "../constants/transactionStatus.js";

export const addTransaction = async (req, res) => {

    const {
        equipmentId,
        quantity,
        purpose,
        notes,
        expectedReturnDate
    } = req.body;

    const userId = req.user.id;

    try {

        if (!equipmentId || !quantity || quantity <= 0) {
            return res.status(400).json({
                error: "Invalid input data"
            });
        }

        if (!purpose?.trim()) {
            return res.status(400).json({
                error: "Purpose is required"
            });
        }

        if (
            !Number.isInteger(Number(quantity)) ||
            Number(quantity) <= 0
        ) {
            return res.status(400).json({
                error: "Quantity must be a positive integer"
            });
        }

        const returnDate = new Date(expectedReturnDate);

        if (
            !expectedReturnDate ||
            isNaN(returnDate.getTime())
        ) {
            return res.status(400).json({
                error: "Invalid expected return date"
            });
        }

        const today = new Date();

        /**
         * Remove time portion
         */
        today.setHours(0, 0, 0, 0);

        returnDate.setHours(0, 0, 0, 0);

        const maxReturnDate = new Date(today);

        maxReturnDate.setDate(
            maxReturnDate.getDate() + 14
        );

        if (returnDate < today) {
            return res.status(400).json({
                error: "Return date cannot be in the past"
            });
        }

        if (returnDate > maxReturnDate) {
            return res.status(400).json({
                error: "Return date cannot exceed 14 days from today"
            });
        }

        const { rows: equipmentRows } = await db.query(
            `
            SELECT
                name,
                available_quantity,
                status
            FROM equipment
            WHERE id = $1
            `,
            [equipmentId]
        );

        const equipment = equipmentRows[0];

        if (!equipment) {
            return res.status(404).json({
                error: "Equipment not found"
            });
        }

        if (
            equipment.status !==
            EQUIPMENT_STATUS.AVAILABLE
        ) {
            return res.status(400).json({
                error: "This equipment is not available for borrowing!"
            });
        }

        if (
            equipment.available_quantity <
            quantity
        ) {
            return res.status(400).json({
                error: "Not enough equipment available"
            });
        }

        const { rows: overdueRows } = await db.query(
            `
            SELECT id
            FROM transactions
            WHERE
                user_id = $1
                AND status = 'Approved'
                AND return_date IS NULL
                AND expected_return_date < NOW()
            LIMIT 1
            `,
            [userId]
        );

        const overdueTransaction = overdueRows[0];

        if (overdueTransaction) {
            return res.status(403).json({
                error: "You have overdue equipment and cannot submit new borrow requests"
            });
        }

        const { rows: existingRows } = await db.query(
            `
            SELECT id
            FROM transactions
            WHERE
                user_id = $1
                AND equipment_id = $2
                AND return_date IS NULL
                AND status IN ('Pending', 'Approved')
            LIMIT 1
            `,
            [userId, equipmentId]
        );

        const existingRequest = existingRows[0];

        if (existingRequest) {
            return res.status(409).json({
                error: "You already have an active request for this equipment"
            });
        }
        const date = new Date(expectedReturnDate);
        const actualExpectedReturnDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            14, 0, 0, 0 //5 PM Jordan Time converted to UTC
        ));
        const result = await db.query(
            `
            INSERT INTO transactions (
                equipment_id,
                user_id,
                type,
                status,
                quantity,
                purpose,
                notes,
                expected_return_date
            )
            VALUES (
                $1,
                $2,
                'Borrow',
                'Pending',
                $3,
                $4,
                $5,
                $6
            )
            RETURNING id
            `,
            [
                equipmentId,
                userId,
                quantity,
                purpose || null,
                notes || null,
                actualExpectedReturnDate || null
            ]
        );

        await sendNotification({
            io: req.io,
            type: NOTIFICATION_TYPES.INFO,
            title: "Request Submitted",
            message: `Your borrow request for ${equipment.name} is pending instructor approval.`,
            userId
        });

        log(req.io,LOG_ACTIONS.BORROW_REQUEST,userId,{
            equipmentName: equipment.name
        })

        res.status(201).json({
            message: "Borrow request submitted successfully",
            transactionId: result.rows[0].id
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });

    }
};

export const getTransactions = async (req, res) => {
    try {

        const { status, limit, orderBy } = req.query;

        let query = `
            SELECT 
                t.id,
                t.equipment_id,
                t.user_id,
                t.type,
                t.status,
                t.purpose,
                t.quantity,
                t.request_date,
                t.expected_return_date,
                t.approval_date,
                t.denial_reason,

                e.name AS equipment_name,
                a.name AS approved_by_name,
                u.name AS user_name,
                u.student_id AS student_id

            FROM transactions t
            LEFT JOIN equipment e ON t.equipment_id = e.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN users a ON t.approved_by = a.id
        `;

        const conditions = [];
        const params = [];

        if (status) {
            if (!Object.values(TRANSACTION_STATUS).includes(status)){
                return res.status(400).json({error: "Invalid status"})
            }
            conditions.push(`t.status = $${params.length + 1}`);
            params.push(status);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        let orderColumn = "request_date";

        if (orderBy) {

            const allowedSortColumns = [
                "request_date",
                "approval_date",
                "return_date",
                "expected_return_date"
            ];

            if (!allowedSortColumns.includes(orderBy)) {
                return res.status(400).json({
                    error: "Invalid orderby value"
                });
            }

            orderColumn = orderBy;
        }

        query += ` ORDER BY t.${orderColumn} DESC`;

        let limitValue;
        try {
            limitValue = parseLimit(limit);
        } catch (err) {
            return res.status(400).json({error: err.message});
        }

        if (limitValue !== null) {
            params.push(limitValue);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await db.query(query, params);

        res.json(
            camelcaseKeys(rows, { deep: true })
        );

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyTransactions = async (req, res) => {
    try {

        const userId = req.user.id;

        const {
            limit,
            type,
            status,
            returned
        } = req.query;

        let params = [];
        let conditions = [];

        // Always restrict to current user
        conditions.push(`t.user_id = $${params.length + 1}`);
        params.push(userId);

        // Optional filters
        if (type) {
            conditions.push(`t.type = $${params.length + 1}`);
            params.push(type);
        }

        if (status) {
            if (!Object.values(TRANSACTION_STATUS).includes(status)){
                return res.status(400).json({error: "Invalid status"})
            }
            conditions.push(`t.status = $${params.length + 1}`);
            params.push(status);
        }

        if (returned === "true") {
            conditions.push("t.return_date IS NOT NULL");
        }

        if (returned === "false") {
            conditions.push("t.return_date IS NULL");
        }

        const whereClause = `WHERE ${conditions.join(" AND ")}`;

        let query = `
            SELECT 
                t.id,
                t.equipment_id,
                t.user_id,
                t.type,
                t.status,
                t.purpose,
                t.quantity,
                t.request_date,
                t.expected_return_date,
                t.approval_date,
                t.return_date,
                t.denial_reason,
                
                e.name AS equipment_name,
                a.name AS approved_by_name,
                u.name AS user_name,
                u.student_id AS student_id

            FROM transactions t
            LEFT JOIN equipment e ON t.equipment_id = e.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN users a ON t.approved_by = a.id

            ${whereClause}

            ORDER BY t.request_date DESC
        `;

        let limitValue;
        try {
            limitValue = parseLimit(limit);
        } catch (err) {
            return res.status(400).json({error: err.message});
        }

        if (limitValue !== null) {
            params.push(limitValue);
            query += ` LIMIT $${params.length}`;
        }

        const { rows } = await db.query(query, params);

        res.json(camelcaseKeys(rows, { deep: true }));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const denyTransaction = async (req, res) => {

    const { txnId } = req.params;
    const deniedBy = req.user.id;
    const reason = req.body?.reason;
    try {
        if (!reason?.trim()) {
            return res.status(400).json({error: "Denial reason is required"});
        }
        const { rows: txnRows } = await db.query(
            `
            SELECT
                t.*,
                e.name AS equipment_name,
                u.name AS user
            FROM transactions t
            LEFT JOIN equipment e
                ON t.equipment_id = e.id
            LEFT JOIN users u ON t.user_id = u.id    
            WHERE t.id = $1
            `,
            [txnId]
        );

        const txn = txnRows[0];

        if (!txn) {
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        if (txn.status !== "Pending") {
            return res.status(400).json({
                error: "Transaction is not pending"
            });
        }

        await db.query(
            `
            UPDATE transactions
            SET
                status = 'Denied',
                approved_by = $1,
                approval_date = NOW(),
                denial_reason = $2
            WHERE id = $3
            `,
            [deniedBy,reason || null, txnId]
        );

        await sendNotification({
            io: req.io,
            type: NOTIFICATION_TYPES.ERROR,
            title: "Borrow Request Denied",
            message: `Your borrow request for "${txn.equipment_name}" has been denied.`,
            userId: txn.user_id,
            transactionId: txn.id
        });

        log(req.io,LOG_ACTIONS.DENY_TRANSACTION,deniedBy,{
            equipmentName: txn.equipment_name,
            user: txn.user
        })

        res.json({
            message: "Transaction denied successfully"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            error: err.message
        });

    }
};

export const approveTransaction = async (req, res) => {

    const { txnId } = req.params;
    const approvedBy = req.user.id;

    const connection = await db.connect()

    try {

        await connection.query("BEGIN");

        const { rows: txnRows } = await connection.query(
            `
            SELECT *
            FROM transactions
            WHERE id = $1
            FOR UPDATE
            `,
            [txnId]
        );

        const txn = txnRows[0];

        if (!txn) {
            await connection.query("ROLLBACK");
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        if (txn.status !== "Pending") {
            await connection.query("ROLLBACK");
            return res.status(400).json({
                error: "Transaction is not pending"
            });
        }

        const { rows: equipmentRows } = await connection.query(
            `
            SELECT name, available_quantity,status
            FROM equipment
            WHERE id = $1
            FOR UPDATE
            `,
            [txn.equipment_id]
        );

        const equipment = equipmentRows[0];

        if (!equipment) {
            await connection.query("ROLLBACK");
            return res.status(404).json({
                error: "Equipment not found"
            });
        }

        if (equipment.available_quantity < txn.quantity) {
            await connection.query("ROLLBACK");
            return res.status(400).json({
                error: "Not enough equipment available"
            });
        }

        await connection.query(
            `
            UPDATE transactions
            SET status = 'Approved',
                approval_date = NOW(),
                approved_by = $1
            WHERE id = $2
            `,
            [approvedBy, txnId]
        );
        const stockLeft = equipment.available_quantity - txn.quantity;

        const newStatus = stockLeft > 0 ? equipment.status : EQUIPMENT_STATUS.IN_USE;
        await connection.query(
            `
            UPDATE equipment SET available_quantity = available_quantity - $1,status = $2 WHERE id = $3`,
            [txn.quantity, newStatus, txn.equipment_id]
        );
        const { rows: userRows } = await connection.query(
            `
            SELECT name
            FROM users
            WHERE id = $1
            `,
            [approvedBy]
        );

        const user = userRows[0];

        await connection.query("COMMIT");

        await sendNotification({
            io: req.io,
            type: NOTIFICATION_TYPES.SUCCESS,
            title: "Request Approved",
            message: `Your borrow request for ${equipment.name} has been approved by ${user.name}.`,
            userId: txn.user_id
        });

        const { rows: labAssistants } = await connection.query(
            `
            SELECT id
            FROM users
            WHERE role = 'lab-assistant'
            `
        );

        const userIds = labAssistants.map(u => u.id);

        if (stockLeft <= 0) {

            await sendNotificationToUsers({
                io: req.io,
                type: NOTIFICATION_TYPES.ERROR,
                title: "Equipment Out of Stock",
                message: `${equipment.name} is out of stock.`,
                userIds
            });

        } else if (stockLeft <= 2) {

            await sendNotificationToUsers({
                io: req.io,
                type: NOTIFICATION_TYPES.WARNING,
                title: "Low Stock Alert",
                message: `${equipment.name} stock is running low. Only ${stockLeft} item(s) remaining.`,
                userIds
            });
        }
        const targetUserRows = await db.query("SELECT name FROM users WHERE id=$1",[txn.user_id])
        log(req.io,LOG_ACTIONS.APPROVE_TRANSACTION,approvedBy,{
            equipmentName: equipment.name,
            user: targetUserRows.rows[0].name || "Unknown"
        })
        res.json({
            message: "Transaction approved successfully"
        });

    } catch (err) {

        await connection.query("ROLLBACK");
        console.log(err)
        res.status(500).json({
            error: err.message
        });

    } finally {
        connection.release();
    }
};

export const returnTransaction = async (req, res) => {

    const { txnId } = req.params;
    const userId = req.user.id;

    const { conditionType, notes } = req.body;

    const connection = await db.connect();

    try {

        await connection.query("BEGIN");

        const { rows: txnRows } = await connection.query(
            `
            SELECT *
            FROM transactions
            WHERE id = $1
            AND user_id = $2
            FOR UPDATE
            `,
            [txnId, userId]
        );

        const txn = txnRows[0];

        if (!txn) {
            await connection.query("ROLLBACK");
            return res.status(404).json({ error: "Transaction not found" });
        }

        if (txn.status !== "Approved") {
            await connection.query("ROLLBACK");
            return res.status(400).json({
                error: "Only approved transactions can be returned"
            });
        }

        if (txn.return_date) {
            await connection.query("ROLLBACK");
            return res.status(400).json({
                error: "Transaction already returned"
            });
        }

        const { rows: equipmentRows } = await connection.query(
            `
            SELECT id,name,status
            FROM equipment
            WHERE id = $1
            FOR UPDATE
            `,
            [txn.equipment_id]
        );

        const equipment = equipmentRows[0];

        if (!equipment) {
            await connection.query("ROLLBACK");
            return res.status(404).json({ error: "Equipment not found" });
        }

        await connection.query(
            `
            UPDATE transactions
            SET
                type = 'Return',
                status = 'Completed',
                return_date = NOW()
            WHERE id = $1
            `,
            [txnId]
        );
        const newStatus = equipment.status === EQUIPMENT_STATUS.IN_USE ? EQUIPMENT_STATUS.AVAILABLE : equipment.status
        await connection.query(
            `
            UPDATE equipment
            SET available_quantity = available_quantity + $1,
            status = $2
            WHERE id = $3
            `,
            [txn.quantity,newStatus, txn.equipment_id]
        );

        await connection.query(
            `
            INSERT INTO return_details (
                transaction_id,
                condition_type,
                notes
            )
            VALUES ($1, $2, $3)
            `,
            [txnId, conditionType, notes]
        );

        await connection.query("COMMIT");
        log(req.io,LOG_ACTIONS.RETURN_EQUIPMENT,userId,{
            equipmentName: equipment.name
        })
        res.json({
            message: "Equipment returned successfully"
        });

    } catch (err) {

        await connection.query("ROLLBACK");

        res.status(500).json({
            error: err.message
        });

    } finally {

        connection.release();
    }
};