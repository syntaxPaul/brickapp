const { pool } = require('../config/database');

class DeliveryModel {
    static async getDrivers(branchId) {
        const branchFilter = branchId ? 'WHERE d.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT d.*,
                   COUNT(dt.id) AS total_trips,
                   COUNT(CASE WHEN dt.status = 'Completed' THEN 1 END) AS completed_trips
            FROM drivers d
            LEFT JOIN delivery_trips dt ON d.id = dt.driver_id
            ${branchFilter}
            GROUP BY d.id
            ORDER BY d.name
        `, params);
        return result.rows;
    }

    static async createDriver(driverData) {
        const { branchId, name, surname, phone, email, license_number, license_expiry, employee_id, hire_date } = driverData;
        
        const result = await pool.query(`
            INSERT INTO drivers (branch_id, name, surname, phone, email, license_number, license_expiry, employee_id, hire_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [branchId, name, surname, phone, email, license_number, license_expiry, employee_id, hire_date]);
        return result.rows[0];
    }

    static async getTrips(branchId) {
        const branchFilter = branchId ? 'WHERE dt.branch_id = $1' : '';
        const params = branchId ? [branchId] : [];
        
        const result = await pool.query(`
            SELECT dt.*,
                   o.customer_name,
                   o.delivery_address,
                   d.name AS driver_name,
                   d.surname AS driver_surname
            FROM delivery_trips dt
            LEFT JOIN orders o ON dt.order_id = o.id
            LEFT JOIN drivers d ON dt.driver_id = d.id
            ${branchFilter}
            ORDER BY dt.trip_date DESC, dt.departure_time DESC
        `, params);
        return result.rows;
    }

    static async getTripById(id, branchId) {
        const result = await pool.query(`
            SELECT dt.*,
                   o.customer_name,
                   o.customer_phone,
                   o.delivery_address,
                   o.total_amount,
                   d.name AS driver_name,
                   d.surname AS driver_surname,
                   d.phone AS driver_phone
            FROM delivery_trips dt
            LEFT JOIN orders o ON dt.order_id = o.id
            LEFT JOIN drivers d ON dt.driver_id = d.id
            WHERE dt.id = $1 AND dt.branch_id = $2
        `, [id, branchId]);
        return result.rows[0];
    }

    static async createTrip(tripData) {
        const { 
            branchId, order_id, driver_id, vehicle_registration, vehicle_type, 
            trip_date, departure_time, status, delivery_notes, created_by 
        } = tripData;
        
        const result = await pool.query(`
            INSERT INTO delivery_trips (
                branch_id, order_id, driver_id, vehicle_registration, vehicle_type,
                trip_date, departure_time, status, delivery_notes, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [branchId, order_id, driver_id, vehicle_registration, vehicle_type, trip_date, departure_time, status || 'Scheduled', delivery_notes, created_by]);
        return result.rows[0];
    }

    static async updateTripStatus(id, branchId, status) {
        const result = await pool.query(`
            UPDATE delivery_trips 
            SET status = $1
            WHERE id = $2 AND branch_id = $3
            RETURNING *
        `, [status, id, branchId]);
        return result.rows[0];
    }

    static async completeTrip(id, branchId, tripData) {
        const { return_time, distance_km, fuel_used_liters, toll_cost, signature_received, delivery_notes } = tripData;
        
        const result = await pool.query(`
            UPDATE delivery_trips 
            SET return_time = $1, distance_km = $2, fuel_used_liters = $3, 
                toll_cost = $4, signature_received = $5, delivery_notes = COALESCE($6, delivery_notes),
                status = 'Completed'
            WHERE id = $7 AND branch_id = $8
            RETURNING *
        `, [return_time, distance_km, fuel_used_liters, toll_cost, signature_received, delivery_notes, id, branchId]);
        return result.rows[0];
    }

    static async getMonthlyStats(branchId) {
        const branchFilter = branchId ? 'AND branch_id = ' + branchId : '';
        
        const result = await pool.query(`
            SELECT COUNT(*) AS total_trips,
                   COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed_trips,
                   COUNT(CASE WHEN status = 'In Progress' THEN 1 END) AS in_progress_trips,
                   COUNT(CASE WHEN status = 'Scheduled' THEN 1 END) AS scheduled_trips
            FROM delivery_trips
            WHERE EXTRACT(MONTH FROM trip_date) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND EXTRACT(YEAR FROM trip_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              ${branchFilter}
        `);
        return result.rows[0];
    }
}

module.exports = DeliveryModel;