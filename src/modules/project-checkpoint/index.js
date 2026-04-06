const { ResponseHandler } = require("../../utils");

const { ProjectCheckpointService: Service } = require('../../services')

class ProjectCheckpointModule {
    static async getDataCheckpoint(req, res, next) {
        try {
            const projectId = req.params.project;
            const result = await Service.provideGetDataCheckpoint(projectId);
            return ResponseHandler.success(req, res, 'success get data checkpoint', result, 200);
        } catch (error) {
            return next(error);
        }
    }

    static async update(req, res, next) {
    try {
        const { bodyRequest } = req;
        const AuthUser = req.userData;
        await Service.provideUpdate(
            bodyRequest, 
            AuthUser
        );

        ResponseHandler.success(req, res, 'Success update data checkpoint', null, 200);
    } catch (error) {
        return next(error);
    }
}


}

module.exports = ProjectCheckpointModule