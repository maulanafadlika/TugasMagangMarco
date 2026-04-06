const { ResponseHandler } = require('../../utils');
const { ForecastPrincipalService: Service } = require('../../services');

class ForecastPrincipalModule {
    static async store(req, res, next) {
        try {
            const { bodyRequest } = req;
            const AuthUser = req.userData;
            const execution = await Service.provideStore(bodyRequest, AuthUser);
            ResponseHandler.success(req, res, 'Success add data forecast principal', {}, 200);
        } catch (error) {
            return next(error)
        }
    }

    static async getAll(req, res, next) {
        try {
            const AuthUser = req.userData;
            const result = await Service.provideGetAll(AuthUser);
            ResponseHandler.success(req, res, 'Success get data forecast principal', result, 200);
        } catch (error) {
            return next(error)
        }
    }

    static async getForecastParams(req, res, next) {
        try {
            const paramId = req.query.param_id
            const result = await Service.provideGetParams(paramId);
            ResponseHandler.success(req, res, 'Success get data forecast principal params', result, 200);
        } catch (error) {
            return next(error);
        }
    }

    static async getReportRevenue(req, res, next) {
        try {
            const { year, month } = req.query
            const bodyRequest = {
                year: year || '2026',
                month: month || '1'
            }
            const result = await Service.reportRevenue(bodyRequest);
            ResponseHandler.success(req, res, 'Success get data forecast revenue', result, 200);
        } catch (error) {
            return next(error);
        }
    }


    static async delete(req, res, next) {
        try {
            const { fr_id } = req.params;
            // const dekripPoNumber = atob(po_numb);
            const AuthUser = req.userData;
            const execution = await Service.provideDelete(fr_id, AuthUser);
            return ResponseHandler.success(req, res, 'success delete data forecast principal', {}, 200);
        } catch (error) {
            return next(error);
        }
    }


    static async update(req, res, next) {
        try {
            const { fr_id } = req.params;
            console.log('data iddd', fr_id)
            const { bodyRequest } = req;
            const AuthUser = req.userData;
            const execution = await Service.provideUpdate(
                bodyRequest,
                fr_id,
                AuthUser
            );

            ResponseHandler.success(req, res, 'Success update data forecast principal', null, 200);
        } catch (error) {
            return next(error);
        }
    }

}

module.exports = ForecastPrincipalModule;
