const SUCCESS = "Success"
const FAILED = "Failed"



export const LOG_ACTIONS = {

    // Auth
    LOGIN_SUCCESS: {
        code: "LOGIN_SUCCESS",
        status: SUCCESS,
        format: () => "User logged in successfully"
    },

    LOGIN_FAILED_NO_USER: {
        code: "LOGIN_FAILED_NO_USER",
        status: FAILED,
        format: () => "Login failed: user not found"
    },

    LOGIN_FAILED_WRONG_PASSWORD: {
        code: "LOGIN_FAILED_WRONG_PASSWORD",
        status: FAILED,
        format: () => "Login failed: incorrect password"
    },

    LOGIN_FAILED_SERVER_ERROR: {
        code: "LOGIN_FAILED_SERVER_ERROR",
        status: FAILED,
        format: () => "Login failed: server error"
    },

    // Users
    REGISTER_USER: {
        code: "REGISTER_USER",
        status: SUCCESS,
        format: (d) => `New user registered: ${d.user}`
    },

    CHANGE_PASSWORD: {
        code: "CHANGE_PASSWORD",
        status: SUCCESS,
        format: () => `User changed their password`
    },

    // Transactions
    BORROW_REQUEST: {
        code: "BORROW_REQUEST",
        status: SUCCESS,
        format: (d) =>
            `New borrow request submitted for ${d.equipmentName}`
    },

    APPROVE_TRANSACTION: {
        code: "APPROVE_TRANSACTION",
        status: SUCCESS,
        format: (d) =>
            `Borrow request for ${d.equipmentName} approved for user ${d.user}`
    },

    DENY_TRANSACTION: {
        code: "DENY_TRANSACTION",
        status: FAILED,
        format: (d) =>
            `Borrow request for ${d.equipmentName} denied for user ${d.user}`
    },

    RETURN_EQUIPMENT: {
        code: "RETURN_EQUIPMENT",
        status: SUCCESS,
        format: (d) =>
            `${d.equipmentName} returned`
    },

    // Equipment
    ADD_EQUIPMENT: {
        code: "ADD_EQUIPMENT",
        status: SUCCESS,
        format: (d) =>
            `Added new equipment: ${d.equipmentName}`
    },

    DELETE_EQUIPMENT: {
        code: "DELETE_EQUIPMENT",
        status: SUCCESS,
        format: (d) =>
            `Deleted equipment: ${d.equipmentName}`
    },

    UPDATE_EQUIPMENT: {
        code: "UPDATE_EQUIPMENT",
        status: SUCCESS,
        format: (d) => {

            const changes = [];

            if (d.newStatus !== undefined) {
                changes.push(`status to ${d.newStatus}`);
            }

            if (d.totalQuantity !== undefined) {
                changes.push(`total quantity to ${d.totalQuantity}`);
            }

            if (d.availableQuantity !== undefined) {
                changes.push(`available quantity to ${d.availableQuantity}`);
            }

            return `Updated ${d.equipmentName} ${changes.join(", ")}`;
        }
    },
};

export const LogMap = Object.fromEntries(
    Object.values(LOG_ACTIONS).map(a => [a.code, a])
)