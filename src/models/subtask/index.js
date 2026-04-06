const PostgresConnection = require("../../utils/databasePgConnection");

class SubtasklistModel {
  constructor() {
    this.db = new PostgresConnection();
  }

  async findById(codeId) {
    const sql = `
                  SELECT 
                    ps.kode as kode,
                    ps.tasklist_id as tasklist_id,
                    ps.title as title,
                    ps.description as description,
                    ps.attachment as attachment,
                    ps.created_by as created_by,
                    ps.assignee as assignee,
                    ps.status_id as status_id,
                    ps.startdate,
                    ps.duedate,
                    pp.id as project_id,
                    pp."name" as project_name,
                    ps.resolved_time,
                    ps.mandays
                  FROM pm_subtasklist ps
                  join pm_tasklist pt on pt.kode = ps.tasklist_id
                  join pm_project pp on pt.project_id = pp.id 
                  where ps.kode = $1`;
    const params = [codeId];

    try {
      const result = await this.db.query(sql, params);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findAll(tasklistCode) {
    const sql = ` SELECT 
                    ps.kode, 
                    ps.title, 
                    ps.description, 
                    ps.attachment, 
                    ps.assignee_id,
                    COALESCE(u2.name, u1.name) AS assignee,
                    ps.created_by, 
                    ps.startdate,
                    ps.duedate,
                    pt.startdate AS startdate_parent,
                    pt.duedate AS duedate_parent,
                    u.name AS created_by_name, 
                    ps.status_id, 
                    pst.name AS status_name,
                    pp.id AS project_id,
                    pp.project_name AS project_name,
                    ps.mandays,
                    pst.is_done,
                    pst.is_todo
                FROM pm_subtasklist ps
                JOIN pm_status pst ON ps.status_id = pst.id
                JOIN pm_tasklist pt ON ps.tasklist_id = pt.kode
                JOIN pm_project pp ON pp.id = pt.project_id 
                LEFT JOIN users u ON ps.created_by = u.id
                LEFT JOIN users u1 ON ps.assignee_id = u1.id           
                LEFT JOIN users u2 ON ps.assignee = u2.name           
                WHERE 
                    ps.tasklist_id = $1 
                    AND ps.is_active = '1'`;
    const params = [tasklistCode];

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async getCountSubtakslist(tasklistCode) {
    const sql = `SELECT COUNT(*) AS count_data FROM pm_subtasklist ps WHERE ps.tasklist_id = $1`;
    const params = [tasklistCode];

    try {
      const result = await this.db.query(sql, params);
      return result[0];
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async create(data) {
    const sql = `INSERT INTO pm_subtasklist (kode, tasklist_id, title, description, attachment, created_by, assignee, status_id, startdate, duedate, mandays, assignee_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;
    const params = [
      data.kode,
      data.tasklist_id,
      data.title,
      data.description,
      data.attachment,
      data.created_by,
      data.assignee,
      data.status_id,
      data.startdate,
      data.duedate,
      data.mandays,
      data.assignee_id
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
    const sql = `UPDATE pm_subtasklist
                 SET title = $1, description = $2, attachment = $3, assignee = $4, startdate = $6, duedate = $7, status_id = $8, mandays = $9, assignee_id = $10
                 WHERE kode = $5
                `;
    const params = [
      inputRequest.title,
      inputRequest.description,
      inputRequest.attachment,
      inputRequest.assignee,
      inputRequest.codeId,
      inputRequest.startdate,
      inputRequest.duedate,
      inputRequest.status_id,
      inputRequest.mandays,
      inputRequest.assignee_id
    ];

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async delete(inputRequest) {
    const sql = `UPDATE pm_subtasklist SET is_active=$2 WHERE kode=$1`;
    const params = [inputRequest.kode, inputRequest.is_active];
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async updateStatus(inputStatus, subtasklistCode) {
    const sql = `update pm_subtasklist
                 set status_id = $1
                 where kode = $2
                `;
    const params = [inputStatus, subtasklistCode];
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async udpateAssigne(inputAssignee, subtasklistCode) {
    const sql = `update pm_subtasklist
                 set assignee = $1
                 where kode = $2
                `;
    const params = [inputAssignee, subtasklistCode];
    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async syncronizeSubTaskTimeFrame(inputRequest) {
    const sql = `UPDATE pm_subtasklist SET updated_time=$1 , resolved_time=$3 WHERE kode=$2`;
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

module.exports = SubtasklistModel;
