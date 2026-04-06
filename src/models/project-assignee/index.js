const PostgresConnection = require("../../utils/databasePgConnection");

class ProjectAssigneeModel {
  constructor() {
    this.db = new PostgresConnection();
  }

  async findAll(userId) {
    const sql = `select ppa.project_id  as project_id,
                CASE 
                    WHEN pp.fase = '0' THEN pp.project_name
                    ELSE CONCAT(pp.project_name, ' - Fase ', pp.fase)
                END AS project_name, 
                ppa.user_assignment as assignee_id
                 from pm_project_assignment ppa
                 join pm_project pp  on pp.id  = ppa.project_id 
                 where ppa.user_assignment = $1
                 order by pp.name asc`;
    const params = [userId];
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findAssigneeByProject(projectId) {
    try {
      const sql = `
        select 
            u.id as assignee_id, 
            u.name as assignee_name,
            ppa.project_id as project_id 
        from pm_project_assignment ppa 
        join users u on u.id = ppa.user_assignment
        where ppa.project_id = $1
        order by u.name asc;
      `;
      const params = [projectId];
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findStatusProject(statusId) {
    const sql = `SELECT 
                      ps.id AS status_id, 
                      ps.name AS status_name, 
                      ps.single_process AS status_single_process,
                      ps.mode AS status_mode,
                      ps.is_todo,
                      ps.is_done
                  FROM 
                      pm_status ps 
                  WHERE 
                      ps.id = $1`;
    const params = [statusId];
    try {
      const result = await this.db.query(sql, params);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

async findTasksliskAssignee(projectId, assigneeId = null) {
  let params = [projectId];
  let whereClause = `where pt.project_id = $1 AND pt.is_active = '1'`;

  if (assigneeId !== null && assigneeId !== undefined) {
    const namesArray = assigneeId.split(",").map((id) => id.trim());
    const placeHolderParameter = namesArray.map((_, index) => `$${index + 2}`).join(", ");
    whereClause += ` AND pt.assignee_id IN (${placeHolderParameter})`;
    params = params.concat(namesArray);
  }

  const sql = `
    SELECT pt.kode as tasklist_code, 
           pt.duedate as tasklist_duedate,
           pt.assignee_id as tasklist_assignee_id,
           u."name" as tasklist_assignee_name,
           pt.task_severity as tasklist_severity,
           pt.title as tasklist_title, 
           pt.status_id as tasklist_status_id, 
           ps."name" as tasklist_status_name,
           ps.mode AS tasklist_status_mode
    FROM pm_tasklist pt 
    JOIN pm_status ps ON ps.id = pt.status_id
    JOIN users u ON u.id = pt.assignee_id
    ${whereClause}
    ORDER BY pt.updated_time DESC NULLS LAST
  `;

  try {
    const result = await this.db.query(sql, params);
    return result;
  } catch (error) {
    await this.db.close();
    throw error;
  }
}


  async updateStatus(inputRequest) {
    const sql = `UPDATE pm_tasklist 
                 SET status_id=$2, 
                     rewrite_status_count=$3,
                     assignee_id=$4,
                     updated_time=$5
                 WHERE kode=$1`;
    const params = [inputRequest.kode, inputRequest.status_id, inputRequest.rewrite_status_count, inputRequest.assignee_id,inputRequest.updated_time];
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }
  

  async countTaskSingleProcess(project_id, user_id, status_id) {
    const sql = `
                  select count(pt.kode) as result_count
                  from pm_tasklist pt 
                  where pt.project_id = $1 and pt.assignee_id = $2 and pt.status_id = $3
                `;
    const params = [project_id, user_id, status_id];
    try {
      const result = await this.db.query(sql, params);
      return result[0];
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }
}

module.exports = ProjectAssigneeModel;
