const { ResponseHandler } = require('../../utils');
const { PurchaseOrderService: Service } = require('../../services');

class PurchaseOrderModule {
    static async store(req, res, next) {
        try {
            const { bodyRequest } = req;
            const AuthUser = req.userData;
            console.log('data masukk',bodyRequest)
            const execution = await Service.provideStore(bodyRequest, AuthUser);
            ResponseHandler.success(req, res, 'Success add data project purchase order', {}, 200);
        } catch (error) {
            return next(error)
        }
    }

    static async getAll(req, res, next) {
        try {
            const authUser = req.userData;
            const result = await Service.provideGetAll(authUser);
            ResponseHandler.success(req, res, 'Success get data project purchase order', result, 200);
        } catch (error) {
            return next(error)
        }
    }

    static async getProjectIdandName(req, res, next) {
        try {
            const result = await Service.provideGetProjectIdandName();
            ResponseHandler.success(req, res, 'Success get data project purchase order', result, 200);
        } catch (error) {
            return next(error);
        }
    }


    static async getPendingProjects(req, res, next) {
        try {
            const result = await Service.provideGetPendingProjects();
            ResponseHandler.success(req, res, 'Success get data project purchase order', result, 200);
        } catch (error) {
            return next(error);
        }
    }

    static async delete(req, res, next) {
        try {
            const { po_numb } = req.params;
	    const dekripPoNumber = atob(po_numb);
            const AuthUser = req.userData;
            const execution = await Service.provideDelete({poNumber : dekripPoNumber }, AuthUser);
            return ResponseHandler.success(req, res, 'success delete data', {}, 200);
        } catch (error) {
            return next(error);
        }
    }


static async update(req, res, next) {
    try {
        const { po_number } = req.params;
        const dekripPoNumber = atob(po_number);
        const { bodyRequest } = req;
        const AuthUser = req.userData;
        const execution = await Service.provideUpdate(
            bodyRequest, 
            { poNumber: dekripPoNumber }, 
            AuthUser
        );

        ResponseHandler.success(req, res, 'Success update data project purchase order', null, 200);
    } catch (error) {
        return next(error);
    }
}

}

module.exports = PurchaseOrderModule;
