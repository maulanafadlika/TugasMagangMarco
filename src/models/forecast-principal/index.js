const PostgresConnection = require("../../utils/databasePgConnection");

class ForecastPrincipalModel {

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

    async findByNumb(frId) {
        try {
            const sql = 'SELECT * FROM pm_forecast_principal WHERE id = $1'
            const params = [frId];

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
            pfp.id,
            pfp.sales_name AS sales_id,
            u3.name AS "sales_name",
            pfp.source,
            p2.description AS "source_name",
            pfp.company_si,
            p3.description AS "company_si_name",
            pfp.customer,
            c.name AS "customer_name",
            pfp.customer_type,
            p4.description AS "customer_type_name",
            pfp.product_category,
            p5.description AS "product_category_name",
            pfp.po_type,
            p6.description AS "po_type_name",
            pfp.status,
            p7.description AS "status_name",
            pfp.project_category,
            p8.description AS "project_category_name",
            pfp.project_name,
            pfp.po_number,
            pfp.project_nominal,
            pfp.updated_by,
            u1.name AS "updated_by_name",
            pfp.created_by,
            u2.name AS "created_by_name",
            pfp.created_time,
            pfp.updated_time,
            pfp.discount,
            pfp.total_price,
            pfp.start_periode,
            pfp.end_periode,
            pfp.site,
            ppo.is_create_forecast,
            COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            'id', pfc.id,
                            'forecast_id', pfc.forecast_id,
                            'description', pfc.description,
                            'termint_payment', pfc.termint_payment,
                            'created_by', pfc.created_by,
                            'created_time', pfc.created_time,
                            'updated_time', pfc.updated_time,
                            'updated_by', pfc.updated_by,
                            'duedate', CASE 
                                WHEN pfc.duedate IS NOT NULL 
                                THEN to_char(pfc.duedate + interval '7 hours', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                                ELSE NULL 
                            END,
                            'position', pfc.position,
                            'persentase', pfc.persentase,
                            'mode', pfc.mode,
                            'status_payment', pfc.status_payment
                        ) ORDER BY pfc.duedate ASC
                    )
                    FROM pm_forecast_checkpoint pfc
                    WHERE pfc.forecast_id = pfp.id
                ),
                '[]'::json
            ) AS checkpoint
        FROM pm_forecast_principal pfp
        LEFT JOIN pm_parameter p2 ON p2.data = pfp.source AND p2.code = 'SOURCE'
        LEFT JOIN pm_parameter p3 ON p3.data = pfp.company_si AND p3.code = 'COMPANY_SI'
        LEFT JOIN pm_parameter p4 ON p4.data = pfp.customer_type AND p4.code = 'CUST_TYPE'
        LEFT JOIN pm_parameter p5 ON p5.data = pfp.product_category AND p5.code = 'PRD_CTG'
        LEFT JOIN pm_parameter p6 ON p6.data = pfp.po_type AND p6.code = 'PO_TYPE'
        LEFT JOIN pm_parameter p7 ON p7.data = pfp.status AND p7.code = 'FRC_STATS'
        LEFT JOIN pm_parameter p8 ON p8.data = pfp.project_category AND p8.code = 'PRJ_CATEGORY'
        LEFT JOIN customers c ON pfp.customer = c.id
        LEFT JOIN users u1 ON pfp.updated_by = u1.id
        LEFT JOIN users u2 ON pfp.created_by = u2.id
        LEFT JOIN users u3 ON pfp.sales_name = u3.id
        LEFT JOIN project_purchase_orders ppo ON ppo.forecast_id = pfp.id 
        WHERE pfp.is_active = '1' 
        AND (
            ($1::text IS NULL OR $1::text = 'intelix') AND (pfp.site IS NULL OR pfp.site = 'intelix')
            OR $1::text IS NOT NULL AND $1::text != 'intelix' AND pfp.site = $1
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

    async reportRevenue(inputRequest) {
        try {
            const sql = `SELECT
                        TO_CHAR(start_periode, 'YYYY-MM') AS "month",
                        TO_CHAR(start_periode, 'Month YYYY') AS "month_name",
                        COUNT(*) AS "total_po",
                        SUM(total_price) AS "total_revenue",
                        SUM(discount) AS "avg_discount_percentage",
                        SUM(project_nominal - total_price) AS "total_discount",
                        SUM(project_nominal) AS "total_project_nominal"
                    FROM pm_forecast_principal
                    WHERE
                        is_active = '1'
                        AND EXTRACT(YEAR FROM start_periode) = $1
                        AND EXTRACT(MONTH FROM start_periode) = $2
                    GROUP BY TO_CHAR(start_periode, 'YYYY-MM'), TO_CHAR(start_periode, 'Month YYYY')
                    ORDER BY "month";
                    `
            const params = [
                inputRequest.year,
                inputRequest.month
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async detailReportRevenue(inputRequest) {
        try {
            const sql = `SELECT 
                            u.name as "sales_name",
                            p7.description as "company_si",
                            c.name as "customer",
                            p1.description as "customer_type",
                            a.project_name,
                            p2.description as "project_category",
                            a.po_number,
                            p3.description as "po_type",
                            p4.description as "product_category",
                            p5.description as "status",
                            p6.description as "source",
                            a.project_nominal,
                            a.discount,
                            a.total_price,
                            a.start_periode,
                            a.end_periode,
                            TO_CHAR(a.start_periode, 'YYYY-MM') AS "target_month"
                        FROM pm_forecast_principal a
                        left join users u ON u.id = a.sales_name
                        left join customers c on c.id = a.customer
                        left join pm_parameter p1 on p1.data = a.customer_type and p1.code = 'CUST_TYPE'
                        left join pm_parameter p2 on p2.data = a.project_category and p2.code = 'PRJ_CATEGORY'
                        left join pm_parameter p3 on p3.data = a.po_type and p3.code = 'PO_TYPE'
                        left join pm_parameter p4 on p4.data = a.product_category and p4.code = 'PRD_CTG'
                        left join pm_parameter p5 on p5.data = a.status and p5.code = 'FRC_STATS'
                        left join pm_parameter p6 on p6.data = a.source and p6.code = 'SOURCE'
                        left join pm_parameter p7 on p7.data = a.company_si and p7.code = 'COMPANY_SI'
                        WHERE 
                            a.is_active = '1'
                            AND EXTRACT(YEAR FROM a.start_periode) = $1
                            AND EXTRACT(MONTH FROM a.start_periode) = $2
                        `
            const params = [
                inputRequest.year,
                inputRequest.month
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async create(inputRequest) {

        try {
            const sql = `INSERT INTO pm_forecast_principal (
                            id, sales_name, source, 
                            company_si, customer, customer_type, 
                            product_category, po_type, status, project_name, 
                            project_category,po_number, project_nominal, created_by, discount, total_price, start_periode, end_periode, site)
                         VALUES (
                            $1, $2, $3, $4, $5, $6, $7,  
                            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`;
            const params = [
                inputRequest.id,
                inputRequest.sales_name,
                inputRequest.source,
                inputRequest.company_si,
                inputRequest.customer,
                inputRequest.customer_type,
                inputRequest.product_category,
                inputRequest.po_type,
                inputRequest.status,
                inputRequest.project_name,
                inputRequest.project_category,
                inputRequest.po_number,
                inputRequest.project_nominal,
                inputRequest.created_by,
                inputRequest.discount,
                inputRequest.total_price,
                inputRequest.start_periode,
                inputRequest.end_periode,
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
            const sql = `UPDATE pm_forecast_principal
                     SET sales_name = $1, 
                         source = $2, 
                         company_si = $3, 
                         customer = $4, 
                         customer_type = $5, 
                         product_category = $6, 
                         po_type = $7, 
                         status = $8,
                         project_name = $9, 
                         project_category = $10, 
                         po_number = $11, 
                         project_nominal = $12, 
                         updated_by = $13, 
                         updated_time = NOW(),
                         discount = $15,
                         total_price = $16,
                         start_periode = $17,
                         end_periode = $18,
                         site = $19
                     WHERE id = $14`;
            const params = [
                inputRequest.sales_name,
                inputRequest.source,
                inputRequest.company_si,
                inputRequest.customer,
                inputRequest.customer_type,
                inputRequest.product_category,
                inputRequest.po_type,
                inputRequest.status,
                inputRequest.project_name,
                inputRequest.project_category,
                inputRequest.po_number,
                inputRequest.project_nominal,
                inputRequest.updated_by,
                inputRequest.id,
                inputRequest.discount,
                inputRequest.total_price,
                inputRequest.start_periode,
                inputRequest.end_periode,
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

    async delete(frId) {
        const sql = `UPDATE pm_forecast_principal
                        SET is_active = '0'
                        WHERE id = $1`;
        const params = [frId];

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
            const sql = `INSERT INTO pm_forecast_checkpoint (
                            id, forecast_id, description, 
                            termint_payment, created_by ,duedate, position, persentase, mode, status_payment
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                        )`;

            const params = [
                inputRequest.id,
                inputRequest.forecast_id,
                inputRequest.description,
                inputRequest.termint_payment,
                inputRequest.created_by,
                inputRequest.duedate,
                inputRequest.position,
                inputRequest.persentase,
                inputRequest.mode,
                inputRequest.status_payment
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }



    async findCheckpoint(fr_id) {
        try {
            const sql = `SELECT * 
                            FROM pm_forecast_checkpoint
                            WHERE forecast_id = $1
                            ORDER BY duedate ASC;
                        `;
            const params = [fr_id];

            const result = await this.db.query(sql, params);
            return result
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async forecastParams(paramId) {
        try {
            const sql = `SELECT data, description
                         FROM pm_parameter
                         WHERE code = $1 AND is_active = true
                        `;
            const params = [paramId];

            const result = await this.db.query(sql, params);
            return result
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async deleteCheckpoint(fr_id) {
        const sql = `DELETE FROM pm_forecast_checkpoint WHERE forecast_id=$1`;
        const params = [fr_id];

        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

}

module.exports = ForecastPrincipalModel;