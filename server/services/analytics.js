import {db} from "../db/connection.js";
import { calculatePercentageChange } from "../utils/stats.js";
export const getEquipmentByStatusData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status,
            COUNT(*) AS value,
            ROUND(
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipment),
                2
            ) AS percentage
        FROM equipment
        GROUP BY status
        ORDER BY CASE status
            WHEN 'Available' THEN 1
            WHEN 'In Use' THEN 2
            WHEN 'Maintenance' THEN 3
            WHEN 'Reserved' THEN 4
        END
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.status) {
            case "Available":
                color = "#27ae60";
                break;
            case "In Use":
                color = "#3498db";
                break;
            case "Maintenance":
                color = "#f39c12";
                break;
            case "Reserved":
                color = "#9b59b6";
                break;
        }

        return {
            ...value,
            color
        };
    });
};

export const getMostBorrowedEquipmentData = async () => {
    const { rows } = await db.query(`
        SELECT 
            e.name AS name,
            COUNT(t.id) AS borrows
        FROM equipment AS e
        LEFT JOIN transactions AS t
            ON t.equipment_id = e.id
        GROUP BY e.name
        ORDER BY COUNT(t.id) DESC
    `);

    return rows;
};

export const getEquipmentByCategoryData = async () => {
    const { rows } = await db.query(`
        SELECT 
            c.id,
            c.name AS category,
            COUNT(e.id) AS count
        FROM equipment e
        JOIN categories c ON e.category_id = c.id
        GROUP BY c.id, c.name
    `);

    const total = rows.reduce(
        (sum, r) => sum + Number(r.count),
        0
    );

    return rows.map((r) => ({
        id: r.id,
        name: r.category || "Uncategorized",
        value: Number(r.count),
        percentage: total
            ? Math.round((Number(r.count) / total) * 100)
            : 0
    }));
};

export const getEquipmentUtilizationRateData = async () => {
    const { rows } = await db.query(`
        SELECT 
            e.name,
            CASE 
                WHEN e.total_quantity = 0 THEN 0
                ELSE ROUND((e.total_quantity - e.available_quantity) * 100.0 / e.total_quantity,2)
            END AS utilization
        FROM equipment e
    `);

    return rows;
};

export const getUserDistributionData = async () => {
    const { rows } = await db.query(`
        SELECT 
            role AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) AS percentage
        FROM users
        GROUP BY role
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.label) {
            case "student":
                color = "#3498db";
                break;
            case "lab-assistant":
                color = "#27ae60";
                break;
            case "instructor":
                color = "#f39c12";
                break;
            case "admin":
                color = "#9b59b6";
                break;
        }

        return {
            ...value,
            label: `${value.label} (${value.percentage}%)`,
            color
        };
    });
};

export const getEquipmentHealthData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipment), 2) AS percentage
        FROM equipment
        GROUP BY status
    `);

    return rows.map((value) => {
        let label = value.label;
        let color = "#999";

        switch (value.label) {
            case "Available":
                label = "Operational";
                color = "#27ae60";
                break;
            case "In Use":
                label = "Avg. Utilization";
                color = "#3498db";
                break;
            case "Maintenance":
                color = "#e9333f";
                break;
        }

        return {
            ...value,
            label,
            color
        };
    });
};

export const getRequestStatusData = async () => {
    const { rows } = await db.query(`
        SELECT 
            status AS label,
            COUNT(*) AS value,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM transactions), 2) AS percentage
        FROM transactions
        GROUP BY status
    `);

    return rows.map((value) => {
        let color = "#999";

        switch (value.label) {
            case "Pending":
                color = "#f39c12";
                break;
            case "Approved":
                color = "#27ae60";
                break;
            case "Completed":
                color = "#3498db";
                break;
        }

        return {
            ...value,
            color
        };
    });
};

export const getPeakRequestHoursData = async () => {
    const { rows } = await db.query(`
        SELECT 
            EXTRACT(HOUR FROM request_date) AS hour,
            COUNT(*) AS requests
        FROM transactions
        GROUP BY EXTRACT(HOUR FROM request_date)
        ORDER BY requests DESC
    `);

    return rows;
};

export const getWeeklyRequestActivityData = async () => {
    const { rows } = await db.query(`
        SELECT 
            TO_CHAR(request_date, 'Dy') AS day,
            SUM(CASE WHEN type = 'Borrow' THEN 1 ELSE 0 END) AS borrows,
            SUM(CASE WHEN type = 'Return' THEN 1 ELSE 0 END) AS returns
        FROM transactions
        WHERE request_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(request_date), TO_CHAR(request_date, 'Dy')
        ORDER BY DATE(request_date)
    `);

    return rows;
};

export const getWeeklyRequestApprovalActivityData = async () => {
    const { rows } = await db.query(`
        SELECT 
            TO_CHAR(request_date, 'Dy') AS day,
            COUNT(*) AS requests,
            COUNT(*) FILTER (WHERE approval_date IS NOT NULL) AS approvals,
            COUNT(*) FILTER (WHERE status = 'Denied') AS denials
        FROM transactions
        WHERE request_date >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(request_date), TO_CHAR(request_date, 'Dy')
        ORDER BY DATE(request_date)
    `);

    return rows;
};



export const getStudentStats = async (userId) => {

    const [
        activeResult,
        activeCurrentMonthResult,
        activePreviousMonthResult,

        completedResult,
        completedCurrentMonthResult,
        completedPreviousMonthResult,

        equipmentResult,
        pendingResult
    ] = await Promise.all([

        // Active borrows
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE type = 'Borrow'
            AND status = 'Approved'
            AND return_date IS NULL
            AND user_id = $1
        `,[userId]),

        // Active borrows this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE approval_date IS NOT NULL
            AND DATE_TRUNC('month', request_date) =
                DATE_TRUNC('month', CURRENT_DATE)
            AND user_id = $1     
        `,[userId]),

        // Active borrows last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE approval_date IS NOT NULL
            AND DATE_TRUNC('month', request_date) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND user_id = $1    
        `,[userId]),

        // Completed returns total
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Completed'
            AND user_id = $1 
        `,[userId]),

        // Completed returns this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Completed'
            AND DATE_TRUNC('month', return_date) =
                DATE_TRUNC('month', CURRENT_DATE)
            AND user_id = $1    
        `,[userId]),

        // Completed returns last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Completed'
            AND DATE_TRUNC('month', return_date) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
            AND user_id = $1    
        `,[userId]),

        // Available equipment
        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE available_quantity > 0
        `),

        // Pending requests for current user
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE status = 'Pending'
            AND user_id = $1
        `, [userId])
    ]);

    const activeCurrentMonth =
        Number(activeCurrentMonthResult.rows[0].count);

    const activePreviousMonth =
        Number(activePreviousMonthResult.rows[0].count);

    const activeBorrowsChangePercent =
        calculatePercentageChange(
            activeCurrentMonth,
            activePreviousMonth
        );

    const completedCurrentMonth =
        Number(completedCurrentMonthResult.rows[0].count);

    const completedPreviousMonth =
        Number(completedPreviousMonthResult.rows[0].count);

    const completedReturnsChangePercent =
        calculatePercentageChange(
            completedCurrentMonth,
            completedPreviousMonth
        );

    return {

        activeBorrows: {
            count: Number(activeResult.rows[0].count),
            changePercent: activeBorrowsChangePercent,
            isPositive: activeBorrowsChangePercent >= 0
        },

        completedReturns: {
            count: Number(completedResult.rows[0].count),
            changePercent: completedReturnsChangePercent,
            isPositive: completedReturnsChangePercent >= 0
        },

        availableEquipment: {
            count: Number(equipmentResult.rows[0].count),
            changePercent: 0,
            isPositive: true
        },

        pendingRequests: {
            count: Number(pendingResult.rows[0].count),
            changePercent: 0,
            isPositive: true
        },

        comparisonPeriod: "vs last month"
    };
};

export const getInstructorStats = async () => {

    const [
        todayResult,
        currentMonthResult,
        previousMonthResult
    ] = await Promise.all([

        // Approved today
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE approval_date IS NOT NULL
            AND approval_date::date = CURRENT_DATE
        `),

        // Approved this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE approval_date IS NOT NULL
            AND DATE_TRUNC('month', approval_date) =
                DATE_TRUNC('month', CURRENT_DATE)
        `),

        // Approved last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE approval_date IS NOT NULL
            AND DATE_TRUNC('month', approval_date) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        `)
    ]);

    const approvedToday =
        Number(todayResult.rows[0].count);

    const currentMonth =
        Number(currentMonthResult.rows[0].count);

    const previousMonth =
        Number(previousMonthResult.rows[0].count);

    const approvedChangePercent =
        calculatePercentageChange(
            currentMonth,
            previousMonth
        );

    return {
        approvedToday: {
            count: approvedToday,
            changePercent: approvedChangePercent,
            isPositive: approvedChangePercent >= 0
        },
    };
};

export const getLabAssistantStats = async () => {

    const [
        statsResult,
        currentMonthResult,
        previousMonthResult
    ] = await Promise.all([

        // Current equipment stats
        db.query(`
            SELECT
                COUNT(*) AS total_equipment,
                SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) AS available,
                SUM(CASE WHEN status = 'Maintenance' THEN 1 ELSE 0 END) AS maintenance,
                SUM(CASE WHEN status = 'In Use' THEN 1 ELSE 0 END) AS in_use
            FROM equipment
        `),

        // Equipment added this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE)
        `),

        // Equipment added last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        `)
    ]);

    const stats = statsResult.rows[0];

    const currentMonth =
        Number(currentMonthResult.rows[0].count);

    const previousMonth =
        Number(previousMonthResult.rows[0].count);

    const equipmentChangePercent =
        calculatePercentageChange(
            currentMonth,
            previousMonth
        );

    return {

        totalEquipment: {
            count: Number(stats.total_equipment),
            changePercent: equipmentChangePercent,
            isPositive: equipmentChangePercent >= 0
        },

        available: {
            count: Number(stats.available),
            changePercent: 0,
            isPositive: true
        },

        maintenance: {
            count: Number(stats.maintenance),
            changePercent: 0,
            isPositive: true
        },

        inUse: {
            count: Number(stats.in_use),
            changePercent: 0,
            isPositive: true
        },
    };
};


export const getAdminStats = async () => {

    const [
        usersResult,
        equipmentResult,
        transactionsResult,

        currentUsersMonthResult,
        previousUsersMonthResult,

        currentEquipmentMonthResult,
        previousEquipmentMonthResult,

        currentTransactionsMonthResult,
        previousTransactionsMonthResult
    ] = await Promise.all([

        // Total counts
        db.query(`
            SELECT COUNT(*) AS count
            FROM users
        `),

        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
        `),

        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
        `),

        // Users this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE)
        `),

        // Users last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM users
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        `),

        // Equipment this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE)
        `),

        // Equipment last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM equipment
            WHERE DATE_TRUNC('month', created_at) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        `),

        // Transactions this month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE DATE_TRUNC('month', request_date) =
                DATE_TRUNC('month', CURRENT_DATE)
        `),

        // Transactions last month
        db.query(`
            SELECT COUNT(*) AS count
            FROM transactions
            WHERE DATE_TRUNC('month', request_date) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        `)
    ]);

    const usersChangePercent = calculatePercentageChange(
        Number(currentUsersMonthResult.rows[0].count),
        Number(previousUsersMonthResult.rows[0].count)
    );

    const equipmentChangePercent = calculatePercentageChange(
        Number(currentEquipmentMonthResult.rows[0].count),
        Number(previousEquipmentMonthResult.rows[0].count)
    );

    const transactionsChangePercent = calculatePercentageChange(
        Number(currentTransactionsMonthResult.rows[0].count),
        Number(previousTransactionsMonthResult.rows[0].count)
    );

    return {
        users: {
            count: Number(usersResult.rows[0].count),
            changePercent: usersChangePercent,
            isPositive: usersChangePercent >= 0
        },

        equipment: {
            count: Number(equipmentResult.rows[0].count),
            changePercent: equipmentChangePercent,
            isPositive: equipmentChangePercent >= 0
        },

        transactions: {
            count: Number(transactionsResult.rows[0].count),
            changePercent: transactionsChangePercent,
            isPositive: transactionsChangePercent >= 0
        },

    };
};