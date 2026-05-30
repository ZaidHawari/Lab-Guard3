import {db} from "../db/connection.js";
import camelcaseKeys from "camelcase-keys";
import {EQUIPMENT_STATUS} from "../constants/equipmentStatus.js";
import {log} from "../utils/logger.js";
import {LOG_ACTIONS} from "../constants/logActions.js";

export const getEquipment = async (req, res) => {
    try {

        const { rows } = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.model,
                e.serial_number,
                e.status,
                e.total_quantity,
                e.available_quantity,
                e.image_url,
                e.description,

                c.name AS category,
                l.lab_name,
                l.section

            FROM equipment e
            LEFT JOIN categories c
                ON e.category_id = c.id

            LEFT JOIN locations l
                ON e.location_id = l.id
        `);

        const formatted = rows.map(e => ({
            ...e,
            location: `${e.lab_name}${e.section ? " - " + e.section : ""}`
        }));

        res.json(
            camelcaseKeys(formatted, { deep: true })
        );

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }
};

export const addEquipment = async (req, res) => {

    const {
        name,
        categoryId,
        model,
        serialNumber,
        locationId,
        status,
        totalQuantity,
        availableQuantity,
        imageUrl,
        description
    } = req.body;

    try {

        if (!name?.trim()) {
            return res.status(400).json({
                error: "Equipment name is required"
            });
        }

        if (!categoryId) {
            return res.status(400).json({
                error: "Category is required"
            });
        }

        if (!model?.trim()) {
            return res.status(400).json({
                error: "Model is required"
            });
        }

        if (!serialNumber?.trim()) {
            return res.status(400).json({
                error: "Serial number is required"
            });
        }

        if (!locationId) {
            return res.status(400).json({
                error: "Location is required"
            });
        }

        if (!status?.trim()) {
            return res.status(400).json({
                error: "Status is required"
            });
        }

        if (!Object.values(EQUIPMENT_STATUS).includes(status)) {
            return res.status(400).json({
                error: "Invalid status"
            });
        }

        if (
            totalQuantity == null ||
            Number(totalQuantity) < 1
        ) {
            return res.status(400).json({
                error: "Total quantity must be at least 1"
            });
        }

        if (
            availableQuantity == null ||
            Number(availableQuantity) < 0
        ) {
            return res.status(400).json({
                error: "Available quantity cannot be negative"
            });
        }

        if (
            Number(availableQuantity) >
            Number(totalQuantity)
        ) {
            return res.status(400).json({
                error: "Available quantity cannot exceed total quantity"
            });
        }

        const { rows: categoryRows } = await db.query(
            "SELECT id FROM categories WHERE id = $1",
            [categoryId]
        );

        const category = categoryRows[0];

        if (!category) {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        const { rows: locationRows } = await db.query(
            "SELECT id FROM locations WHERE id = $1",
            [locationId]
        );

        const location = locationRows[0];

        if (!location) {
            return res.status(404).json({
                error: "Location not found"
            });
        }

        const { rows: existingEquipmentRows } = await db.query(
            `
            SELECT id
            FROM equipment
            WHERE serial_number = $1
            `,
            [serialNumber]
        );

        const existingEquipment = existingEquipmentRows[0];

        if (existingEquipment) {
            return res.status(409).json({
                error: "Serial number already exists"
            });
        }

        const result = await db.query(
            `
            INSERT INTO equipment (
                name,
                category_id,
                model,
                serial_number,
                location_id,
                status,
                total_quantity,
                available_quantity,
                image_url,
                description,
                created_at
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                NOW()
            )
            RETURNING id
            `,
            [
                name,
                categoryId,
                model,
                serialNumber,
                locationId,
                status,
                totalQuantity,
                availableQuantity,
                imageUrl,
                description
            ]
        );
        const equipmentId = result.rows[0].id
        await log(req.io, LOG_ACTIONS.ADD_EQUIPMENT, req.user.id, {equipmentId,equipmentName: name})
        res.status(201).json({
            message: "Created equipment successfully",
            equipmentId
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });

    }
};


export const updateEquipment = async (req, res) => {
    const {id} = req.params
    const {status, totalQuantity, availableQuantity } = req.body;

    if (!id) {
        return res.status(400).json({error: "Missing id field"});
    }

    try {
        const result = await db.query(
            "SELECT * FROM equipment WHERE id = $1", [id]
        );

        const equipment = result.rows[0];

        if (!equipment) {
            return res.status(404).json({error: "Equipment not found"});
        }

        const updatedStatus = status ?? equipment.status;
        if (!Object.values(EQUIPMENT_STATUS).includes(updatedStatus)){
            return res.status(400).json({error: "Invalid equipment status"})
        }
        const updatedTotalQty = totalQuantity ?? equipment.total_quantity;
        const updatedAvailableQty = availableQuantity ?? equipment.available_quantity;

        if (updatedTotalQty < 0 || updatedAvailableQty < 0 || isNaN(updatedTotalQty) || isNaN(updatedAvailableQty) || updatedAvailableQty > updatedTotalQty)
        {
            return res.status(400).json({error: "Invalid quantity values"});
        }

        const updateResult = await db.query(
            `UPDATE equipment SET status = $1, total_quantity = $2, available_quantity = $3
             WHERE id = $4
             RETURNING id, name`,
            [updatedStatus, updatedTotalQty, updatedAvailableQty, id]
        );

        log(req.io, LOG_ACTIONS.UPDATE_EQUIPMENT, req.user.id, {
            id: updateResult.rows[0].id,
            equipmentName: updateResult.rows[0].name,
            newStatus: updatedStatus,
            totalQuantity: updatedTotalQty,
            availableQuantity: updatedAvailableQty
        });
        res.json({message: "Equipment updated successfully"});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

export const deleteEquipment = async (req, res) => {

    const { id } = req.params;

    try {
        const { rows: activeRows } = await db.query(
            `SELECT id FROM transactions
             WHERE equipment_id = $1
             AND status IN ('Pending', 'Approved')
             LIMIT 1`,
            [id]
        );

        if (activeRows.length > 0) {
            return res.status(400).json({
                error: "Cannot delete equipment with active borrow requests"
            });
        }

        const result = await db.query(
            "DELETE FROM equipment WHERE id = $1 RETURNING name",
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Equipment not found" });
        }

        await log(req.io, LOG_ACTIONS.DELETE_EQUIPMENT, req.user?.id || null,{
            equipmentName: result.rows[0].name
        });

        res.json({ message: `Equipment "${result.rows[0].name}" deleted successfully` });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};