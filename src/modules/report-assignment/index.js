const { ResponseHandler } = require("../../utils");

const { ReportAssignmentService: Service } = require('../../services')

class ReportAssignmentModule {
    static async getReportAssigmentProject(req, res, next) {
        try {
            const projectId = req.params.project;
            const result = await Service.provideGetReportAssignment(projectId);
            return ResponseHandler.success(req, res, 'success get data report asignment', result, 200);
        } catch (error) {
            return next(error);
        }
    }

    static async getDataStatusProject(req, res, next) {
        try {
            const { bodyRequest } = req;
            const result = await Service.provideGetDataStatus(bodyRequest);
            return ResponseHandler.success(req, res, 'success get data status', result, 200);
        } catch (error) {
            return next(error);
        }
    }

}

module.exports = ReportAssignmentModule