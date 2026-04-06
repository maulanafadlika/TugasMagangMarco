const { ProjectCheckpointModel } = require("../../models");
const { ResponseHandler, DateFormatter, createLog } = require("../../utils");

const ProjectCheckpoint = new ProjectCheckpointModel();

class ProjectCheckpointService {
  static async provideGetDataCheckpoint(projectId) {
    let datas = await ProjectCheckpoint.getCheckpoint(projectId);
    return datas;
  }

  static async provideUpdate(bodyRequest, AuthUser) {
    const existedCheckPoint = await ProjectCheckpoint.findCheckpoint(bodyRequest.id);
    if (!existedCheckPoint) {
      throw new CustomError("Failed update, data not found", 400);
    }

    const inputRequest = {
      id: bodyRequest.id ?? existedCheckPoint.id,
      note: bodyRequest.note ?? existedCheckPoint.note,
      duedate: bodyRequest.duedate ?? existedCheckPoint.duedate,
      status: bodyRequest.status ?? existedCheckPoint.status,
    };

    await ProjectCheckpoint.updateCheckpoint(inputRequest);

    // Create activity log data
    let logMessage = `Memperbarui project ${existedCheckPoint.project_name}, `;
    logMessage += `${bodyRequest.status} : ${existedCheckPoint.description}`;

    if (bodyRequest.status === "reschedule") {
      logMessage += `dari tanggal : ${DateFormatter.formatDateNoTime(existedCheckPoint.duedate)} menjadi ${bodyRequest.duedate}`;
    }

    // if (bodyRequest.note) {
    //   logMessage += `, dengan note dari "${existedCheckPoint.note}" menjadi "${bodyRequest.note}"`;
    // }

    await createLog(AuthUser.id, logMessage);
  }
}

module.exports = ProjectCheckpointService;
