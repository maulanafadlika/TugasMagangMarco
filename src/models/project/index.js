const PostgresConnection = require("../../utils/databasePgConnection");

class ProjectModel {
  constructor() {
    this.db = new PostgresConnection();
  }
  async findAll() {
    const sql = `SELECT p.id, 
                      CASE 
                          WHEN p.fase = '0' THEN p.name
                          ELSE CONCAT(p.name, ' - Fase ', p.fase)
                      END AS name,
                      CASE 
                          WHEN p.fase = '0' THEN p.project_name
                          ELSE CONCAT(p.project_name, ' - Fase ', p.fase)
                      END AS project_name,
                      p.description, 
                      p.start_date, 
                      p.end_date, 
                      (SELECT description FROM pm_parameter WHERE data = p.status) AS status, 
                      (SELECT id FROM pm_parameter WHERE data = p.status) AS parameter_id,
                      p.created_by, 
                      u1.name AS created_by_name, 
                      p.created_time, 
                      p.updated_by, 
                      u2.name AS updated_by_name, 
                      p.updated_time,    
                      (SELECT id FROM pm_parameter WHERE data = p.substatus) AS substatus_id,
                      (SELECT description FROM pm_parameter WHERE data = p.substatus) AS substatus,
                      p.status_info,
                      p.fase,
                          d.description AS division,
                          p.pm_id,
                          upm.name AS pm_name
                FROM pm_project p
                LEFT JOIN users u1 ON p.created_by = u1.id
                LEFT JOIN users u2 ON p.updated_by = u2.id
                        LEFT JOIN users upm ON p.pm_id = upm.id
                LEFT JOIN pm_parameter d ON p.division = d.data
                         AND d.code = 'DIVISION' 
                         AND d.is_active = true
                ORDER BY p.name ASC;
                `;
    const params = [];

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }
  

  async findTopProjectByTodoTasks() {
    try {
      const sql = `
                    select pp.id as project_id,
                    CASE 
                      WHEN p.fase = '0' THEN pp."project_name"
                      ELSE CONCAT(pp."project_name", ' - Fase ', pp."fase")
                    END AS  project_name,
                    count(pt.kode) as todo_task_count
                    from pm_project pp 
                    join pm_tasklist pt on pt.project_id = pp.id 
                    join pm_status ps on pt.status_id = ps.id
                    where ps.id = 'TODO'
                    group by pp.id, pp."project_name" 
                    order by count(pt.kode) desc 
                    limit 1
                  `;
      const result = await this.db.query(sql, []);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findCountTaskByProject(project_id, status_id) {
    try {
      const sql = `
                      select count(pt.kode) task_count, pp.id as project_id, pp."project_name" as project_name
                      from pm_tasklist pt 
                      join pm_project pp on pt.project_id = pp.id 
                      where pp.id = $1 and pt.status_id = $2
                      group by pp.id, pp.project_name
                  `;
      const params = [project_id, status_id];
      const result = await this.db.query(sql, params);
      return result[0];
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findByStatusData(status_data, getAll = true) {
    let sql = `
          SELECT * FROM pm_project WHERE status = $1
        `;
    if (getAll === false) {
      sql += " LIMIT 1";
    }

    const params = [status_data];
    try {
      const result = await this.db.query(sql, params);
      return result.length > 0 ? (getAll ? result : result[0]) : getAll ? [] : null;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async findById(id) {
    // const sql = `
    //       SELECT * FROM pm_project WHERE id = $1
    //     `;
    let sql = `
          SELECT *, 
          CASE WHEN po_id IS NULL THEN id ELSE po_id END as po_id
          FROM pm_project WHERE id = $1
        `;
    const params = [id];
    try {
      const result = await this.db.query(sql, params);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async createFromOrder(inputRequest) {
    try {
      const sql = `
                    INSERT INTO pm_project (id, name, description, status, 
                    start_date, end_date, created_by, created_time, 
                    updated_by, updated_time)
                    VALUES ($1, $2, null, null, null, null, $3, NOW(), null, NOW())
                  `;
      const params = [inputRequest.id, inputRequest.name, inputRequest.created_by];

      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async create(inputRequest) {
    const sql = `
            INSERT INTO pm_project (id, name, description, status, substatus, status_info, start_date, end_date, created_by, created_time, updated_by, updated_time, fase, po_id, project_name, division, pm_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $11, $12, $13, $14, $15)
        `;

    const values = [
      inputRequest.id,
      inputRequest.name,
      inputRequest.description,
      inputRequest.status,
      inputRequest.substatus || null,
      inputRequest.status_info || null,
      inputRequest.start_date,
      inputRequest.end_date,
      inputRequest.created_by,
      inputRequest.updated_by,
      inputRequest.fase,
      inputRequest.po_id,
      inputRequest.project_name,
      inputRequest.division,
      inputRequest.pm_id || null
    ];

    try {
      const result = await this.db.query(sql, values);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async update(inputRequest) {
    const sql = `
            UPDATE pm_project
            SET name = $2, 
                description = $3, 
                status = $4, 
                substatus = $5, 
                status_info = $6, 
                start_date = $7, 
                end_date = $8, 
                updated_by = $9, 
                updated_time = NOW(),
                project_name = $10,
                division = $11,
                pm_id = $12
            WHERE id = $1
        `;

    const values = [
      inputRequest.id,
      inputRequest.name,
      inputRequest.description,
      inputRequest.status,
      inputRequest.substatus || null,
      inputRequest.status_info || null,
      inputRequest.start_date,
      inputRequest.end_date,
      inputRequest.updated_by,
      inputRequest.project_name,
      inputRequest.division,
      inputRequest.pm_id || null
    ];

    try {
      const result = await this.db.query(sql, values);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }

  async delete(id) {
    const sql = `DELETE FROM pm_project WHERE id=$1`;
    const params = [id];

    try {
      const result = await this.db.query(sql, params);
      return result;
    } catch (error) {
      await this.db.close();
      throw error;
    }
  }
}

module.exports = ProjectModel;
