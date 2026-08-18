const { pool } = require('../config/database');

class ProductionModel {
    static async getMachines(branchId) {
        const branchFilter = branchId ? 'WHERE m.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT m.*,
                   COUNT(pb.id) AS total_batches,
                   COALESCE(SUM(pb.actual_quantity), 0) AS total_produced,
                   COALESCE(SUM(pb.rejected_quantity), 0) AS total_rejected
            FROM machines m
            LEFT JOIN production_batches pb ON m.id = pb.machine_id
            ${branchFilter}
            GROUP BY m.id
            ORDER BY m.name
        `, params);
        return result.rows;
    }

    static async getMachineById(id, branchId) {
        const result = await pool.query(`
            SELECT * FROM machines 
            WHERE id = $1 AND branch_id = $2
        `, [id, branchId]);
        return result.rows[0];
    }

    static async createMachine(machineData) {
        const { branchId, name, machine_type, model, serial_number, installation_date, daily_capacity, current_shift } = machineData;
        
        const result = await pool.query(`
            INSERT INTO machines (branch_id, name, machine_type, model, serial_number, installation_date, daily_capacity, current_shift)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [branchId, name, machine_type, model, serial_number, installation_date, daily_capacity || 0, current_shift || 'Day']);
        return result.rows[0];
    }

    static async updateMachine(id, branchId, machineData) {
        const { name, machine_type, model, serial_number, installation_date, status, daily_capacity, current_shift } = machineData;
        
        const result = await pool.query(`
            UPDATE machines 
            SET name = $1, machine_type = $2, model = $3, serial_number = $4, installation_date = $5, 
                status = $6, daily_capacity = $7, current_shift = $8
            WHERE id = $9 AND branch_id = $10
            RETURNING *
        `, [name, machine_type, model, serial_number, installation_date, status, daily_capacity, current_shift, id, branchId]);
        return result.rows[0];
    }

    static async getBatches(branchId) {
        const branchFilter = branchId ? 'WHERE pb.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT pb.*, 
                   m.name AS machine_name,
                   p.name AS product_name,
                   p.category AS product_category
            FROM production_batches pb
            LEFT JOIN machines m ON pb.machine_id = m.id
            LEFT JOIN products p ON pb.product_id = p.id
            ${branchFilter}
            ORDER BY pb.start_time DESC
        `, params);
        return result.rows;
    }

    static async generateBatchNumber() {
        const result = await pool.query(`
            SELECT 'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(COALESCE(MAX(CAST(SUBSTRING(batch_number FROM '-(\\d+)$') AS INTEGER)), 0) + 1, 4, '0') AS batch_number
            FROM production_batches
            WHERE batch_number LIKE 'BATCH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%'
        `);
        return result.rows[0].batch_number;
    }

    static async createBatch(batchData) {
        const { branchId, machine_id, product_id, batch_number, planned_quantity, operator_name, shift, notes } = batchData;
        
        const result = await pool.query(`
            INSERT INTO production_batches (branch_id, machine_id, product_id, batch_number, planned_quantity, operator_name, shift, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [branchId, machine_id, product_id, batch_number, planned_quantity, operator_name, shift || 'Day', notes]);
        return result.rows[0];
    }

    static async completeBatch(id, branchId, actualQuantity, rejectedQuantity) {
        const result = await pool.query(`
            UPDATE production_batches 
            SET actual_quantity = $1, rejected_quantity = $2, status = 'Completed', end_time = CURRENT_TIMESTAMP
            WHERE id = $3 AND branch_id = $4
            RETURNING *
        `, [actualQuantity, rejectedQuantity || 0, id, branchId]);
        return result.rows[0];
    }

    static async getBatchById(id, branchId) {
        const result = await pool.query(`
            SELECT * FROM production_batches 
            WHERE id = $1 AND branch_id = $2
        `, [id, branchId]);
        return result.rows[0];
    }
}

module.exports = ProductionModel;