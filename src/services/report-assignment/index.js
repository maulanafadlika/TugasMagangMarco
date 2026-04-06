const { ReportAssignmentModel } = require("../../models");
const { ResponseHandler, DateFormatter } = require("../../utils");

const ReportAssignment = new ReportAssignmentModel()

class ReportAssignmentService {
    static async provideGetReportAssignment(projectId) {
        let datas = await ReportAssignment.getReportAssignment(projectId);
        return datas;
    }

    static async provideGetDataStatus(bodyRequest) {
        const {project_id,status_id} = bodyRequest
        let datas = await ReportAssignment.getDataStatus(project_id,status_id);
        return datas;
    }

}

module.exports = ReportAssignmentService;