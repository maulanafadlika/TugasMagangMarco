const PostgresConnection = require("../../utils/databasePgConnection");

class PurchaseOrderModel {

    constructor() {
        this.db = new PostgresConnection();
    }

    async findCustomerProjects(cust_id) {
        try {
            const sql = `select ppo.project_id, ppo.project_name, ppo.customer as customer_id, pp.start_date, pp.end_date, pps.project_status as project_status
                         from project_purchase_orders ppo 
                         join pm_project pp on ppo.project_id  = pp.id
                         join pm_project_status pps on pp.id = pps.project_id
                         where ppo.customer = $1
                        `;
            const params = [cust_id];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }

    }

    async findByCustomer(cust_id) {
        try {
            const sql = `SELECT * 
                         FROM project_purchase_orders
                         WHERE customer = $1
                         LIMIT 1
                        `;
            const params = [cust_id];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findLastPO(prefix, currentYearMonth) {
        try {
            const sql = `SELECT po_id 
                         FROM project_purchase_orders
                         WHERE po_id LIKE $1
                         ORDER BY po_id DESC
                         LIMIT 1
                        `;
            const params = [`${prefix}${currentYearMonth}%`];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findByPoId(id) {
        try {
            const sql = `SELECT po_id 
                         FROM project_purchase_orders
                         WHERE po_id = $1
                        `;
            const params = [id];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }


    async findLastProjectId(prefix, currentYearMonth) {
        try {
            const sql = `SELECT id
                        FROM pm_project
                        WHERE id LIKE $1
                        ORDER BY id DESC
                        LIMIT 1
                        `;
            const params = [`${prefix}${currentYearMonth}%`];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async getProjectIdandName() {
        try {
            // const sql = 'SELECT project_id, project_name, po_id, po_number,fase, duration FROM project_purchase_orders';
            const sql = `SELECT project_id, project_name,po_id, po_number,fase, duration,
	                    CASE WHEN po_id IS NULL THEN 'F' ELSE 'T' END as po_flag 
	                    FROM public.project_purchase_orders`;
            const params = [];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findByProjectId(project_id) {
        try {
            const sql = 'SELECT * FROM project_purchase_orders WHERE project_id = $1'
            const params = [project_id];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findByNumb(po_number) {
        try {
            const sql = 'SELECT * FROM project_purchase_orders WHERE po_number = $1'
            const params = [po_number];

            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findAll(siteData) {
        try {
            const sql = `
            SELECT 
                ppo.po_number,
                ppo.project_id,
                ppo.project_name,
                ppo.customer AS "customer_id",
                ppo.po_description, 
                ppo.attachment,
                c.name AS "customer_name",
                p.description AS "project_type",
                p.id AS "parameter_id",
                ppo.po_date,
                ppo.duration,
                ppo.updated_by,
                u1.name AS "updated_by_name",
                ppo.updated_time,
                ppo.created_by,
                ppo.live_date,
                u2.name AS "created_by_name",
                ppo.created_time,
                ppo.notification_receivers,
                ppo.po_id,
                ppo.fase,
                (
                    SELECT STRING_AGG(u.name, ', ')
                    FROM users u
                    WHERE u.id = ANY (string_to_array(ppo.notification_receivers, ','))
                ) AS "notification_receiver_names",
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'id', pc.id,
                                'po_id', pc.po_id,
                                'description', pc.description,
                                'duedate', pc.duedate,
                                'payment', pc.payment,
                                'status', pc.status,
                                'position', pc.position,
                                'note', pc.note,
                                'created_time', pc.created_time,
                                'updated_time', pc.updated_time,
                                'is_create_forecast', pc.is_create_forecast,
                                'forecast_id', pc.forecast_id,
                                'termint_payment', pc.termint_payment,
                                'created_by', pc.created_by,
                                'updated_by', pc.updated_by,
                                'persentase', pc.persentase,
                                'mode', pc.mode,
                                'status_payment', pc.status_payment
                            ) ORDER BY pc.position ASC
                        )
                        FROM project_checkpoint pc
                        WHERE pc.po_id = ppo.po_id 
                        AND pc.is_create_forecast = '0'
                    ),
                    '[]'::json
                ) AS checkpoint
            FROM project_purchase_orders ppo
            JOIN pm_parameter p ON p.data = ppo.project_type
            JOIN customers c ON ppo.customer = c.id
            LEFT JOIN users u1 ON ppo.updated_by = u1.id
            LEFT JOIN users u2 ON ppo.created_by = u2.id
            WHERE (
                ($1::text IS NULL OR $1::text = 'intelix') AND (ppo.site IS NULL OR ppo.site = 'intelix')
                OR $1::text NOT IN ('intelix') AND $1::text IS NOT NULL AND ppo.site = $1
            )
        `;
            const params = [siteData];
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async create(inputRequest) {
        try {
            const sql = `INSERT INTO project_purchase_orders (
                            po_number, project_name, customer, 
                            project_type, po_date, created_by, 
                            duration, live_date, attachment, po_description, 
                            notification_receivers,po_id, fase, created_time,
                            forecast_id, total_price, po_type, product_category,
                            project_category, source, company_si, sales_name,
                            project_nominal, discount, customer_type, status,
                            start_periode, end_periode, is_create_forecast, site
                            )
                         VALUES (
                            $1, $2, $3, $4, $5, $6, $7,  
                            $8, $9, $10, $11, $12, $13, NOW(),
                            $14, $15, $16, $17, $18, $19, $20, $21,
                            $22, $23, $24, $25, $26, $27, $28, $29
                            )`;
            const params = [
                inputRequest.po_number,
                inputRequest.project_name,
                inputRequest.customer,
                inputRequest.project_type,
                inputRequest.po_date,
                inputRequest.created_by,
                inputRequest.duration,
                inputRequest.live_date,
                inputRequest.attachment,
                inputRequest.po_description,
                inputRequest.notification_receivers,
                inputRequest.po_id,
                inputRequest.fase,
                inputRequest.forecast_id,
                inputRequest.total_price,
                inputRequest.po_type,
                inputRequest.product_category,
                inputRequest.project_category,
                inputRequest.source,
                inputRequest.company_si,
                inputRequest.sales_name,
                inputRequest.project_nominal,
                inputRequest.discount,
                inputRequest.customer_type,
                inputRequest.status,
                inputRequest.start_periode,
                inputRequest.end_periode,
                inputRequest.is_create_forecast,
                inputRequest.site
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }


    async update(inputRequest) {
        try {
            const sql = `UPDATE project_purchase_orders 
                         SET project_name = $1, customer = $2, project_type = $3, duration = $4, po_date = $5, updated_by = $6, updated_time = NOW() , live_date = $7, attachment = $8, po_description = $9, notification_receivers = $11, fase = $12, site = $13
                         WHERE po_number = $10`;
            const params = [
                inputRequest.project_name,
                inputRequest.customer,
                inputRequest.project_type,
                inputRequest.duration,
                inputRequest.po_date,
                inputRequest.updated_by,
                inputRequest.live_date,
                inputRequest.attachment,
                inputRequest.po_description,
                inputRequest.po_number,
                inputRequest.notification_receivers,
                inputRequest.fase,
                inputRequest.site
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async updateDataPO(inputRequest) {
        try {
            const sql = `UPDATE project_purchase_orders 
                         SET project_id = $1, updated_by = $2, updated_time = NOW()
                         WHERE po_number = $3`;
            const params = [
                inputRequest.project_id,
                inputRequest.updated_by,
                inputRequest.po_number
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async delete(po_numb) {
        const sql = `DELETE FROM project_purchase_orders WHERE po_number=$1`;
        const params = [po_numb];

        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async createCheckpoint(inputRequest) {
        try {
            const sql = `INSERT INTO project_checkpoint (
                            id, po_id, description, 
                            duedate, payment, status, position
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7
                        )`;

            const params = [
                inputRequest.id,
                inputRequest.po_id,
                inputRequest.description,
                inputRequest.duedate,
                inputRequest.payment,
                inputRequest.status,
                inputRequest.position
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async createCheckpointForecast(inputRequest) {
        try {

            const sql = `INSERT INTO project_checkpoint (
                            id, po_id, description, 
                            duedate, payment, status, position, forecast_id, termint_payment, created_by, persentase, mode, status_payment, is_create_forecast
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                        )`;

            const params = [
                inputRequest.id,
                inputRequest.po_id,
                inputRequest.description,
                inputRequest.duedate,
                inputRequest.payment,
                inputRequest.status,
                inputRequest.position,
                inputRequest.forecast_id,
                inputRequest.termint_payment,
                inputRequest.created_by,
                inputRequest.persentase,
                inputRequest.mode,
                inputRequest.status_payment,
                inputRequest.is_create_forecast
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }


    async findCheckpoint(po_id) {
        try {
            const sql = `SELECT * 
                         FROM project_checkpoint
                         WHERE po_id = $1 AND is_create_forecast = '0'
                         ORDER BY position ASC
                        `;
            const params = [po_id];

            const result = await this.db.query(sql, params);
            return result
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async deleteCheckpoint(po_id) {
        const sql = `DELETE FROM project_checkpoint WHERE po_id=$1`;
        const params = [po_id];

        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

}

module.exports = PurchaseOrderModel;