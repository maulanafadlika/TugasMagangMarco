const PostgresConnection = require("../../utils/databasePgConnection");

class TaskListModel {
    constructor() {
        this.db = new PostgresConnection();
    }

    async getCountByStatus(project_id, status_id) {
        const sql = `
                     select count(pt.status_id) as status_count
                     from pm_tasklist pt 
                     where pt.project_id = $1 and pt.status_id = $2
                    `;
        const params = [project_id, status_id];
        try {
            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0].status_count : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async getCountTodoTaskByAssignee(assigneeId, projectId) {
        try {
            const sql = ` 
                            select count( pt.kode ) as task_count, pt.project_id, pp."project_name" as project_name
                            from pm_tasklist pt 
                            join pm_project pp on pp.id = pt.project_id
                            where pt.assignee_id = $1 and pt.project_id = $2 and pt.status_id = 'TODO'
                            group by pt.project_id, pp."project_name" 
                        `;
            const params = [assigneeId, projectId];
            const result = await this.db.query(sql, params);
            return result.length > 0 ? result[0] : 0;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findByProjectandStatus(projectId, statusId) {
        const sql = `
            select * from pm_tasklist pt 
            where pt.project_id = $1 and pt.status_id = $2
        `;
        const params = [projectId, statusId];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findAssigneeByProjectAndName(projectId, assignee) {
        const sql = `
        select pt.assignee_id
        from pm_tasklist pt 
        where pt.project_id = $1 and pt.assignee_id = $2;
    `;
        const params = [projectId, assignee];
        try {
            const result = await this.db.query(sql, params);
            return result.length > 0 ? result : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findAssigneeByProject(projectId) {
        const sql = `
            select pt.assignee_id
            from pm_tasklist pt 
            where pt.project_id = $1;
        `;
        const params = [projectId];
        try {
            const result = await this.db.query(sql, params);
            return result.length > 0 ? result : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findAll(created_by) {
        const sql = `SELECT 
                        pt.*, 
                        u1.name AS created_by_name,
                        u2.name AS updated_by_name
                    FROM 
                        pm_tasklist pt
                    LEFT JOIN 
                        users u1 ON pt.created_by = u1.id
                    LEFT JOIN 
                        users u2 ON pt.updated_by = u2.id
                    WHERE 
                        pt.created_by = $1;`;
        const params = [created_by];
        try {
            const result = await this.db.query(sql, params);
            return result
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }


    async findByProjectID(project_id) {
        const sql = `SELECT 
                        pt.kode, 
                        pt.title, 
                        pt.description, 
                        pt.attachment, 
                        pt.duedate, 
                        pt.assignee_id, 
                        u3.name as assignee,
                        pt.project_id,
                        pt.task_severity,
                        pt.rewrite_status_count, 
                        pt.created_by,
                        pt.startdate,
                        pt.quality_control,
                        pt.sales,
                        pt.infra,
                        pt.sub_pi,
                        pt.status_id, 
                        u.name as created_by_name, 
                        pt.updated_by, 
                        u2.name AS updated_by_name, 
                        pt.business_analyst,
                        pt.mandays,
                        u4.name as project_manager_name,
                        u4.id as project_manager
                    FROM 
                        pm_tasklist pt
                    left JOIN users u on u.id = pt.created_by
                    left JOIN users u2 on u2.id = pt.updated_by
                    left JOIN users u3 on u3.id = pt.assignee_id
                    left JOIN users u4 on u4.id = pt.project_manager
                    where pt.project_id = $1 AND pt.is_active = '1'
                    GROUP BY 
                        pt.kode, 
                        u.name, 
                        u2.name,
                        u3.name,
                        u4.name,
                        u4.id
                    ORDER BY 
                        pt.kode asc;`;

        const params = [project_id];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async findCode(kode) {
        const sql =
            ` SELECT
                pt.kode,
                pt.title,
                pt.description,
                pt.attachment,
                pt.duedate,
                pt.startdate,
                pt.project_id,
                pt.assignee_id,
                u.name AS "assignee_name",
                pt.created_by,
                pt.updated_by,
                pt.status_id,
                pt.rewrite_status_count,
                pt.business_analyst,
                pt.task_severity,
                pt.quality_control,
                pt.sales,
                pt.infra,
                pt.sub_pi,
                pp.id AS project_id,
                pp.project_name AS project_name,
                pt.resolved_time,
                pt.mandays,
                pt.project_manager,
                COALESCE(u2.name, null) AS "project_manager_name"
            FROM pm_tasklist pt
            JOIN users u ON u.id = pt.assignee_id
            LEFT JOIN users u2 ON u2.id = pt.project_manager
            JOIN pm_project pp ON pp.id = pt.project_id
            WHERE pt.kode = $1`;
        const params = [kode];
        try {
            console.log('kode masukkk',kode);
            
            const result = await this.db.query(sql, params);
            console.log('data resulttt',result);
            
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async create(inputRequest) {
        const sql = `INSERT INTO pm_tasklist (kode, title, description, attachment, duedate, startdate, project_id, assignee_id, created_by, status_id, business_analyst, task_severity, quality_control, sales, infra, sub_pi, mandays, project_manager) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;
        const params = [
            inputRequest.kode,
            inputRequest.title,
            inputRequest.description,
            inputRequest.attachment,
            inputRequest.duedate,
            inputRequest.startdate,
            inputRequest.project_id,
            inputRequest.assignee,
            inputRequest.created_by,
            inputRequest.status_id,
            inputRequest.business_analyst,
            inputRequest.task_severity,
            inputRequest.quality_control,
            inputRequest.sales,
            inputRequest.infra,
            inputRequest.sub_pi,
            inputRequest.mandays,
            inputRequest.project_manager
        ];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async update(inputRequest) {
        const sql = `UPDATE pm_tasklist SET title=$2, description=$3, attachment=$4, duedate=$5, assignee_id=$6, project_id=$7, updated_by=$8, business_analyst=$9, task_severity=$10, startdate=$11, status_id=$12, quality_control=$13, sales=$14, infra=$15, sub_pi=$16, mandays=$17, project_manager=$18 WHERE kode=$1`;
        const params = [
            inputRequest.kode,
            inputRequest.title,
            inputRequest.description,
            inputRequest.attachment,
            inputRequest.duedate,
            inputRequest.assignee,
            inputRequest.project_id,
            inputRequest.updated_by,
            inputRequest.business_analyst,
            inputRequest.task_severity,
            inputRequest.startdate,
            inputRequest.status_id,
            inputRequest.quality_control,
            inputRequest.sales,
            inputRequest.infra,
            inputRequest.sub_pi,
            inputRequest.mandays,
            inputRequest.project_manager
        ];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async delete (inputRequest) {
        const sql = `UPDATE pm_tasklist SET is_active=$2 WHERE kode=$1`;
        const params = [
            inputRequest.kode,
            inputRequest.is_active
        ];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async updateAssignee(inputRequest) {
        const sql = `UPDATE pm_tasklist SET assignee_id=$1 WHERE kode=$2`;
        const params = [inputRequest.assignee, inputRequest.kode];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }

    async syncronizeTaskTimeFrame(inputRequest) {
        const sql = `UPDATE pm_tasklist SET updated_time=$1 , resolved_time=$3 WHERE kode=$2`;
        const params = [inputRequest.updated_time, inputRequest.kode, inputRequest.resolved_time];
        try {
            const result = await this.db.query(sql, params);
            return result;
        } catch (error) {
            await this.db.close();
            throw error;
        }
    }
}

module.exports = TaskListModel;
