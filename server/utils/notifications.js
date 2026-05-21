import { db } from "../db/connection.js";
import {NOTIFICATION_TYPES} from "../constants/notificationTypes.js";

export async function sendNotification({
                                           io,
                                           type,
                                           title,
                                           message,
                                           userId,
                                           transactionId = null,
                                           stage = 0
                                       }) {

    try {

        const { rows } = await db.query(
            `
            INSERT INTO notifications
                (user_id, type, title, message, transaction_id, stage)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING id
            `,
            [
                userId,
                type,
                title,
                message,
                transactionId,
                stage
            ]
        );

        const notification = {
            id: rows[0].id,
            userId,
            type,
            title,
            message,
            read: false,
            createdAt: new Date()
        };
        if (io) {
            //Emit realtime notification
            io.to(`user:${userId}`).emit(
                "notification",
                notification
            );
        }

        return notification;

    } catch (err) {

        console.error(
            "Notification Failed:",
            err.message
        );

        throw err;
    }
}

export async function sendNotificationToUsers({
                                                  io,
                                                  type,
                                                  title,
                                                  message,
                                                  userIds,
                                                  transactionId = null,
                                                  stage = 0
                                              }) {

    const notifications = [];

    for (const userId of userIds) {

        const notification = await sendNotification({
            io,
            type,
            title,
            message,
            userId,
            transactionId,
            stage
        });

        notifications.push(notification);
    }

    return notifications;
}

export const processDueDateNotifications = async (io) => {

    try {

        /**
         * 2 DAYS LEFT WARNING
         */
        const { rows: twoDayTxns } = await db.query(
            `
            SELECT
                t.id,
                t.user_id,
                t.expected_return_date,
                e.name AS equipment_name
            FROM transactions t
            LEFT JOIN equipment e
                ON t.equipment_id = e.id
            LEFT JOIN notifications n
                ON n.transaction_id = t.id
                AND n.stage = 1
            WHERE
                t.status = 'Approved'
                AND t.return_date IS NULL
                AND n.id IS NULL
                AND DATE(t.expected_return_date) = DATE(NOW() + INTERVAL '2 days')
            `
        );

        for (const txn of twoDayTxns) {

            await sendNotification({
                io,
                type: NOTIFICATION_TYPES.WARNING,
                title: "Equipment Due Soon",
                message: `Your borrowed equipment "${txn.equipment_name}" is due in 2 days.`,
                userId: txn.user_id,
                transactionId: txn.id,
                stage: 1
            });
        }

        /**
         * 1 DAY LEFT WARNING
         */
        const { rows: oneDayTxns } = await db.query(
            `
            SELECT
                t.id,
                t.user_id,
                t.expected_return_date,
                e.name AS equipment_name
            FROM transactions t
            LEFT JOIN equipment e
                ON t.equipment_id = e.id
            LEFT JOIN notifications n
                ON n.transaction_id = t.id
                AND n.stage = 2
            WHERE
                t.status = 'Approved'
                AND t.return_date IS NULL
                AND n.id IS NULL
                AND DATE(t.expected_return_date) = DATE(NOW() + INTERVAL '1 day')
            `
        );

        for (const txn of oneDayTxns) {

            await sendNotification({
                io,
                type: NOTIFICATION_TYPES.WARNING,
                title: "Equipment Due Tomorrow",
                message: `Your borrowed equipment "${txn.equipment_name}" is due tomorrow.`,
                userId: txn.user_id,
                transactionId: txn.id,
                stage: 2
            });
        }

        /**
         * OVERDUE
         */
        const { rows: overdueTxns } = await db.query(
            `
            SELECT
                t.id,
                t.user_id,
                t.expected_return_date,
                e.name AS equipment_name
            FROM transactions t
            LEFT JOIN equipment e
                ON t.equipment_id = e.id
            LEFT JOIN notifications n
                ON n.transaction_id = t.id
                AND n.stage = 3
            WHERE
                t.status = 'Approved'
                AND t.return_date IS NULL
                AND n.id IS NULL
                AND t.expected_return_date < NOW()
            `
        );

        for (const txn of overdueTxns) {

            await sendNotification({
                io,
                type: NOTIFICATION_TYPES.ERROR,
                title: "Equipment Overdue",
                message: `Your borrowed equipment "${txn.equipment_name}" is overdue.`,
                userId: txn.user_id,
                transactionId: txn.id,
                stage: 3
            });
        }

    } catch (err) {

        console.error(
            "Failed to process due date notifications:",
            err
        );
    }
};