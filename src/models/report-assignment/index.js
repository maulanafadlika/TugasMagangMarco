const PostgresConnection = require("../../utils/databasePgConnection");

class ReportAssignmentModel {
  constructor() {
    this.db = new PostgresConnection();
  }

  async getReportAssignment(project_id) {
    try {
      const sql = `
                    SELECT 
                        'Task' AS issue_type,
                        a.kode AS issue_code,
                        a.title AS summary,
                        b.name AS assignee,
                        a.assignee_id,
                        c.name AS created_by,
                        c.id AS created_id,
                        a.startdate,
                        a.duedate,
                        e.name AS status,
                        a.created_time,
                        a.updated_time,
                        a.resolved_time,
                        a.project_id,
                        d.project_name AS project_name,
                        a.status_id,
                        a.description,
                        '' AS main_task
                    FROM pm_tasklist a
                    LEFT JOIN users b ON a.assignee_id = b.id
                    LEFT JOIN users c ON a.created_by = c.id
                    LEFT JOIN pm_project d ON a.project_id = d.id
                    LEFT JOIN pm_status e ON a.status_id = e.id
                    WHERE a.project_id = $1 AND a.is_active = '1'

                    UNION ALL

                    SELECT 
                        'Sub Task' AS issue_type,
                        a.kode AS issue_code,
                        a.title AS summary,
                        f.name AS assignee,
                        a.assignee_id,
                        c.name AS created_by,
                        c.id AS created_id,
                        a.startdate,
                        a.duedate,
                        e.name AS status,
                        a.created_time,
                        a.updated_time,
                        a.resolved_time,
                        b.project_id,
                        d.project_name AS project_name,
                        a.status_id,
                        a.description,
                        a.tasklist_id AS main_task
                    FROM pm_subtasklist a
                    LEFT JOIN pm_tasklist b ON a.tasklist_id = b.kode
                    LEFT JOIN users c ON a.created_by = c.id
                    LEFT JOIN pm_project d ON b.project_id = d.id
                    LEFT JOIN pm_status e ON a.status_id = e.id
                    LEFT JOIN users f ON a.assignee_id = f.id
                    WHERE b.project_id = $1 AND a.is_active = '1'
            `;
      const params = [project_id];
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

async getDataStatus(project_id,status_id) {
    try {
      const sql = `
              SELECT
                  'Task' AS issue_type,
                  a.kode AS issue_code,
                  a.title AS summary,
                  b.name AS assignee,
                  a.assignee_id,
                  c.name AS created_by,
                  c.id AS created_id,
                  a.startdate,
                  a.duedate,
                  e.name AS status,
                  a.created_time,
                  a.updated_time,
                  a.resolved_time,
                  a.project_id,
                  d.project_name AS project_name,
                  a.status_id,
                  a.description,
                  '' AS main_task
              FROM pm_tasklist a
              LEFT JOIN users b ON a.assignee_id = b.id
              LEFT JOIN users c ON a.created_by = c.id
              LEFT JOIN pm_project d ON a.project_id = d.id
              LEFT JOIN pm_status e ON a.status_id = e.id
              WHERE a.project_id = $1 AND a.status_id = $2 AND a.is_active = '1'

              UNION ALL

              SELECT
                  'Sub Task' AS issue_type,
                  a.kode AS issue_code,
                  a.title AS summary,
                  f.name AS assignee,
                  a.assignee_id,
                  c.name AS created_by,
                  c.id AS created_id,
                  a.startdate,
                  a.duedate,
                  e.name AS status,
                  a.created_time,
                  a.updated_time,
                  a.resolved_time,
                  b.project_id,
                  d.project_name AS project_name,
                  a.status_id,
                  a.description,
                  a.tasklist_id AS main_task
              FROM pm_subtasklist a
              LEFT JOIN pm_tasklist b ON a.tasklist_id = b.kode
              LEFT JOIN users c ON a.created_by = c.id
              LEFT JOIN pm_project d ON b.project_id = d.id
              LEFT JOIN pm_status e ON a.status_id = e.id
              LEFT JOIN users f ON a.assignee_id = f.id
              WHERE b.project_id = $1 AND a.status_id = $2 AND a.is_active = '1'
            `;
      const params = [project_id,status_id];
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }
}

module.exports = ReportAssignmentModel;
