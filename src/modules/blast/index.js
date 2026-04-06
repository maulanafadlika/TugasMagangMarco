const { ResponseHandler } = require("../../utils");

const { BlastService: Service } = require('../../services')

class BlastModule {
    static async blastAction(req, res, next) {
        try {
            const result = await Service.provideBlast();
            return ResponseHandler.success(req, res, 'success blast', result, 200);
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

module.exports = BlastModule