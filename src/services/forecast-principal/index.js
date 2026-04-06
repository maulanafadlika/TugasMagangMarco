const { update, at } = require('lodash');
const { PurchaseOrderModel, ProjectModel, UserModel, CustomerModel, ForecastPrincipalModel } = require('../../models');
const { ResponseHandler, generateProjectId, createLog, CustomError, sendEmail, sendWhatsAppMessage } = require('../../utils');
const project = require('../project');
const { generatePurchaseOrder } = require('../../utils/api/purchaseOrder');
const { generateUuid } = require('../../utils/uuidGenerator');

const ForeCastPrincipal = new ForecastPrincipalModel;
const Project = new ProjectModel();
const User = new UserModel();
const Customer = new CustomerModel();


class ForecastPrincipalService {

    static async provideStore(bodyRequest, AuthUser) {

        const inputRequest = {
            id: generateUuid(),
            sales_name: bodyRequest.sales_name,
            source: bodyRequest.source,
            company_si: bodyRequest.company_si,
            customer: bodyRequest.customer,
            customer_type: bodyRequest.customer_type,
            product_category: bodyRequest.product_category,
            po_type: bodyRequest.po_type,
            status: bodyRequest.status,
            project_name: bodyRequest.project_name,
            project_category: bodyRequest.project_category,
            po_number: bodyRequest.po_number,
            project_nominal: bodyRequest.project_nominal,
            created_by: AuthUser.id,
            discount: bodyRequest.discount,
            total_price: bodyRequest.total_price,
            start_periode: bodyRequest.start_periode,
            end_periode: bodyRequest.end_periode,
            site: bodyRequest.site,
            checkpoint: Array.isArray(bodyRequest.checkpoint) && bodyRequest.checkpoint.length > 0
                ? bodyRequest.checkpoint
                : []
        };


        if (inputRequest.checkpoint.length > 0) {
            try {
                await Promise.all(inputRequest.checkpoint.map(async (item) => {
                    const payloadCheckpoint = {
                        id: generateUuid(),
                        forecast_id: inputRequest.id,
                        description: item.description,
                        duedate: item.duedate ? `${item.duedate}-01` : null,
                        termint_payment: item.termint_payment,
                        created_by: AuthUser.id,
                        position: item.position,
                        persentase: item.persentase,
                        mode: item.mode,
                        status_payment: item.status_payment
                    };

                    return ForeCastPrincipal.createCheckpoint(payloadCheckpoint);
                }));
            } catch (err) {
                throw new CustomError(`Failed to process forecast checkpoint data : ${err} `, 400);
            }
        }


        await ForeCastPrincipal.create(inputRequest);

        // Create activity log
        await createLog(AuthUser.id, `Menambahkan data baru ke tabel pm_forecast_principal: ${bodyRequest.po_number}`);

    }

    static async provideGetAll(AuthUser) {
        const siteData = AuthUser.site || null;
        console.log('site data',siteData)
        const data = await ForeCastPrincipal.findAll(siteData);
        return data;
    }

    static async reportRevenue(bodyRequest) {
        const inputRequest = {
            year: bodyRequest.year || '2026',
            month: bodyRequest.month || '1'
        }

        const [dataReportRevenue, dataDetailRevenue] = await Promise.all([
            ForeCastPrincipal.reportRevenue(inputRequest),
            ForeCastPrincipal.detailReportRevenue(inputRequest)
        ]);

        return {
            data_report: dataReportRevenue,
            data_detail: dataDetailRevenue
        };
    }



    static async provideGetParams(paramId) {
        const data = await ForeCastPrincipal.forecastParams(paramId);
        // console.log('data',data);

        const formattedData = data.map(item => {
            return {
                data: item.data,
                description: item.description
            };
        });

        return formattedData;
    }


    static async provideDelete(frId, AuthUser) {
        console.log('iddelete', frId)
        const existedPO = await ForeCastPrincipal.findByNumb(frId);
        if (existedPO === null) {
            throw new CustomError('failed delete data, data not found', 400)
        }

        await ForeCastPrincipal.delete(frId);

        // Create activity log data
        const createLogs = await createLog(
            AuthUser.id,
            `Menghapus data dari tabel Project_Purchase_Orders: ${frId}`
        );
    }

    static async provideUpdate(bodyRequest, fr_id, AuthUser) {
        // console.log('data_po_number',poNumber)
        const existedPO = await ForeCastPrincipal.findByNumb(fr_id);
        if (!existedPO) {
            throw new CustomError('Failed update, data not found', 400);
        }

        const inputRequest = {
            id: existedPO.id,
            sales_name: bodyRequest.sales_name ?? existedPO.sales_name,
            source: bodyRequest.source ?? existedPO.source,
            company_si: bodyRequest.company_si ?? existedPO.company_si,
            customer: bodyRequest.customer ?? existedPO.customer,
            customer_type: bodyRequest.customer_type ?? existedPO.customer_type,
            product_category: bodyRequest.product_category ?? existedPO.product_category,
            po_type: bodyRequest.po_type ?? existedPO.po_type,
            status: bodyRequest.status ?? existedPO.status,
            project_name: bodyRequest.project_name ?? existedPO.project_name,
            project_category: bodyRequest.project_category ?? existedPO.project_category,
            po_number: bodyRequest.po_number ?? existedPO.po_number,
            project_nominal: bodyRequest.project_nominal ?? existedPO.project_nominal,
            discount: bodyRequest.discount ?? existedPO.discount,
            total_price: bodyRequest.total_price ?? existedPO.total_price,
            start_periode: bodyRequest.start_periode ?? existedPO.start_periode,
            end_periode: bodyRequest.end_periode ?? existedPO.end_periode,
            updated_by: AuthUser.id,
            site: bodyRequest.site ?? existedPO.site,
            checkpoint: Array.isArray(bodyRequest.checkpoint) && bodyRequest.checkpoint.length > 0 ? bodyRequest.checkpoint : []
        };


        if ((existedPO.id)) {
            try {
                await ForeCastPrincipal.deleteCheckpoint(existedPO.id)
            } catch (error) {
                throw new CustomError(`Failed to process delete data checkpoint : ${error}`, 400);
            }
        }

        if (inputRequest.checkpoint.length > 0) {

            try {
                await Promise.all(inputRequest.checkpoint.map(async (item) => {
                    const payloadCheckpoint = {
                        id: generateUuid(),
                        forecast_id: existedPO.id,
                        description: item.description,
                        duedate: item.duedate || item.duedate !== "" ? `${item.duedate}-01` : null,
                        termint_payment: item.termint_payment,
                        created_by: AuthUser.id,
                        position: item.position,
                        persentase: item.persentase,
                        mode: item.mode,
                        status_payment: item.status_payment
                    };

                    return ForeCastPrincipal.createCheckpoint(payloadCheckpoint);
                }));
            } catch (err) {
                throw new CustomError(`Failed to process checkpoint data : ${err}`, 400);
            }
        }

        await ForeCastPrincipal.update(inputRequest);


        // Create activity log data
        await createLog(AuthUser.id, `Memperbarui data di tabel pm_forecast_principal: ${inputRequest.id}`);

    }
}

module.exports = ForecastPrincipalService;