const PostgresConnection = require("../../utils/databasePgConnection");

class ProjectCheckpointModel {
    constructor() {
        this.db = new PostgresConnection();
    }

    async getCheckpoint(project_id) {
        try {
            const sql = `
                    SELECT 
                        pc.id,
                        ppo.po_number, 
                        pp.id as project_id, 
                        CASE 
                            WHEN pp.fase = '0' THEN pp.project_name
                            ELSE CONCAT(pp.project_name, ' - Fase ', pp.fase)
                        END AS project_name,
                        pc.description, 
                        pc.duedate, 
                        pc.payment, 
                        pc.status,
                        pc.note
                    FROM project_checkpoint pc
                    JOIN project_purchase_orders ppo ON pc.po_id = ppo.po_id
                    JOIN pm_project pp ON pc.po_id = pp.po_id
                    WHERE pp.id = $1
                    ORDER BY pc.position ASC `;
            const params = [project_id];
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findCheckpoint(id) {
        try {
            const sql = `
                    SELECT 
                        pc.id,
                        ppo.po_number, 
                        pp.id as project_id, 
                        CASE 
                            WHEN pp.fase = '0' THEN pp.project_name
                            ELSE CONCAT(pp.project_name, ' - Fase ', pp.fase)
                        END AS project_name,
                        pc.description, 
                        pc.duedate, 
                        pc.payment, 
                        pc.status,
                        pc.note
                    FROM project_checkpoint pc
                    JOIN project_purchase_orders ppo ON pc.po_id = ppo.po_id
                    JOIN pm_project pp ON pc.po_id = pp.po_id
                    WHERE pc.id = $1
                    ORDER BY pc.position ASC`;
            const params = [id];
            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

        async updateCheckpoint(inputRequest) {
        try {
            const sql = `UPDATE project_checkpoint
                         SET status = $2, note = $3, duedate = $4
                         WHERE id = $1`;
            const params = [
                inputRequest.id,
                inputRequest.status,
                inputRequest.note,
                inputRequest.duedate
            ];

            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

}

module.exports = ProjectCheckpointModel;
