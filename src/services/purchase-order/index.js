const { update, at } = require('lodash');
const { PurchaseOrderModel, ProjectModel, UserModel, CustomerModel } = require('../../models');
const { ResponseHandler, generateProjectId, createLog, CustomError, sendEmail, sendWhatsAppMessage } = require('../../utils');
const project = require('../project');
const { generatePurchaseOrder } = require('../../utils/api/purchaseOrder');
const { generateUuid } = require('../../utils/uuidGenerator');

const PurchaseOrder = new PurchaseOrderModel();
const Project = new ProjectModel();
const User = new UserModel();
const Customer = new CustomerModel();


class PurchaseOrderService {

    static async provideStore(bodyRequest, AuthUser) {
        const siteData = AuthUser.site || null;
        const existedPO = await PurchaseOrder.findByNumb(bodyRequest.po_number);
        if (existedPO) {
            throw new CustomError('existed data with same order number', 400);
        }

        // const existedProject = await Project.findById(bodyRequest.project_id);
        // if (existedProject) {
        //     throw new CustomError('existed project with same id', 400);
        // }

        // console.log(bodyRequest);

        let inputRequest
        
        if (bodyRequest.is_forecast) {
            inputRequest = {
                po_number: bodyRequest.po_number,
                project_name: bodyRequest.project_name,
                customer: bodyRequest.customer_id,
                duration: bodyRequest.duration,
                po_date: bodyRequest.po_date,
                live_date: bodyRequest.live_date,
                project_type: bodyRequest.project_type,
                created_by: bodyRequest.created_by,
                po_description: bodyRequest.po_description,
                attachment: bodyRequest.attachment ?? null,
                notification_receivers: bodyRequest.notification_receivers,
                po_id: await generatePurchaseOrder('POR'),
                fase: bodyRequest.fase,
                forecast_id: bodyRequest.forecast_id ?? null,
                total_price: bodyRequest.total_price ?? null,
                po_type: bodyRequest.po_type ?? null,
                product_category: bodyRequest.product_category ?? null,
                project_category: bodyRequest.project_category ?? null,
                source: bodyRequest.source ?? null,
                company_si: bodyRequest.company_si ?? null,
                sales_name: bodyRequest.sales_name ?? null,
                project_nominal: bodyRequest.project_nominal ?? null,
                discount: bodyRequest.discount ?? null,
                customer_type: bodyRequest.customer_type ?? null,
                status: bodyRequest.status ?? null,
                start_periode: bodyRequest.start_periode ?? null,
                end_periode: bodyRequest.end_periode ?? null,
                is_create_forecast : '1',
                site: siteData,
                checkpoint: Array.isArray(bodyRequest.checkpoint) && bodyRequest.checkpoint.length > 0
                    ? bodyRequest.checkpoint
                    : []
            }
        } else {
            inputRequest = {
                po_number: bodyRequest.po_number,
                project_name: bodyRequest.project_name,
                customer: bodyRequest.customer_id,
                duration: bodyRequest.duration,
                po_date: bodyRequest.po_date,
                live_date: bodyRequest.live_date,
                project_type: bodyRequest.project_type,
                created_by: bodyRequest.created_by,
                po_description: bodyRequest.po_description,
                attachment: bodyRequest.attachment ?? null,
                notification_receivers: bodyRequest.notification_receivers,
                po_id: await generatePurchaseOrder('POR'),
                fase: bodyRequest.fase,
                forecast_id: bodyRequest.forecast_id ?? null,
                checkpoint: Array.isArray(bodyRequest.checkpoint) && bodyRequest.checkpoint.length > 0
                    ? bodyRequest.checkpoint
                    : []
            };
        }


        if (Array.isArray(inputRequest.checkpoint) && inputRequest.checkpoint.length > 0) {
            if (bodyRequest.is_forecast) {
                try {
                    console.log('eksekusi checkpoint forecast')
                    await Promise.all(inputRequest.checkpoint.map(async (item) => {
                        const payloadCheckpoint = {
                            id: generateUuid(),
                            po_id: inputRequest.po_id,
                            forecast_id: inputRequest.forecast_id,
                            description: item.description,
                            duedate: item.duedate ? `${item.duedate}-01` : null,
                            termint_payment: item.termint_payment,
                            created_by: AuthUser.id,
                            position: item.position,
                            persentase: item.persentase,
                            mode: item.mode,
                            status_payment: item.status_payment,
                            is_create_forecast: '1'
                        };

                        return PurchaseOrder.createCheckpointForecast(payloadCheckpoint);
                    }));
                } catch (err) {
                    throw new CustomError(`Failed to process forecast checkpoint data : ${err} `, 400);
                }
            } else {
                try {
                    await Promise.all(inputRequest.checkpoint.map(async (item) => {
                        const payloadCheckpoint = {
                            id: generateUuid(),
                            po_id: inputRequest.po_id,
                            description: item.description,
                            duedate: item.duedate,
                            payment: item.payment,
                            status: 'todo',
                            position: item.position
                        };

                        return PurchaseOrder.createCheckpoint(payloadCheckpoint);
                    }));
                } catch (err) {
                    throw new CustomError(`Failed to process checkpoint data : ${err} `, 400);
                }
            }
        }


        await PurchaseOrder.create(inputRequest);

        // Create activity log
        await createLog(AuthUser.id, `Menambahkan data baru ke tabel Project_Purchase_Orders: ${bodyRequest.po_number}`);

        const customer = await Customer.findById(inputRequest.customer);
        // console.log(customer);

        // Send email and WhatsApp notifications
        const userIds = bodyRequest.notification_receivers.split(',');
        const userCreator = await User.findById(bodyRequest.created_by);

        const generateNotificationMessage = (createdById, creatorName, poNumber) => ({
            email: `<h5>New PO Information</h5> <br>
                    <p>A New PO has been submitted by ${userCreator.name}</p>
                    <p>PO Number: ${poNumber}</p>
                    <p>PO Date: ${inputRequest.po_date}</p>
                    <p>Customer: ${customer.name}</p>
                    <p>Project Name: ${inputRequest.project_name}</p>
                    <p>Project Type: ${inputRequest.project_type}</p>
                    <p>Description: ${inputRequest.po_description}</p>
            `,
            whatsapp: `New PO Information\n\nA New PO has been submitted by ${userCreator.name}\nPO Number: ${poNumber}\nPO Date: ${inputRequest.po_date}\nCustomer: ${customer.name}\nProject Name: ${inputRequest.project_name}\nProject Type: ${inputRequest.project_type}\nDescription: ${inputRequest.po_description}`

        });

        const sendNotifications = async (user, message) => {
            if (user.email) {
                const subject = 'New Purchase Order';
                const responseSendEmail = await sendEmail({ subject: `New PO Information ${inputRequest.po_number}`, email: user.email, message: message.email });
                console.log(`[INFO]: Email sent to ${user.email}: ${responseSendEmail.statusCode}`);
            }

            if (user.phone_number) {
                const responseSendWhatsApp = await sendWhatsAppMessage({ message: message.whatsapp, phone: user.phone_number });
                console.log(`[INFO]: WhatsApp sent to ${user.phone_number}: ${responseSendWhatsApp.statusCode}`);
            }
        };

        for (const userId of userIds) {
            const assignedUser = await User.findById(userId);

            if (assignedUser) {
                const messageToAssignedUser = generateNotificationMessage(bodyRequest.created_by, userCreator.name, inputRequest.po_number);
                await sendNotifications(assignedUser, messageToAssignedUser);
            }
        }
    }

    static async provideGetAll(AuthUser) {
        const siteData = AuthUser.site || null;
        const data = await PurchaseOrder.findAll(siteData);
        return data;
    }

    static async provideGetProjectIdandName() {
        const data = await PurchaseOrder.getProjectIdandName();
        // console.log('data',data);

        const formattedData = data.map(item => {
            return {
                id: item.project_id || item.po_id,
                name: item.project_name,
                duration: item.duration,
                po_id: item.po_id,
                po_number: item.po_number,
                po_flag: item.po_flag
            };
        });

        return formattedData;
    }

    static async provideGetPendingProjects() {
        // Get existing projects from Project table
        const existData = await Project.findAll();
        // Get project data from PurchaseOrder
        const data = await PurchaseOrder.getProjectIdandName();

        // Create a Map of existing project base names (without phase info) to their phases
        const existingProjectMap = new Map();

        for (const project of existData) {
            // Make sure fase is treated as a string for consistency
            const fase = String(project.fase);

            // Extract the base project name (without the phase suffix)
            let baseName = project.name;
            if (fase !== '0') {
                // Remove " - Fase X" suffix
                baseName = project.name.replace(/ - Fase \d+$/, '');
            }

            if (!existingProjectMap.has(baseName)) {
                existingProjectMap.set(baseName, new Set());
            }
            // Add the phase to the set of used phases for this project
            existingProjectMap.get(baseName).add(fase);
        }

        // Format the data, making sure used phases don't appear in dropdown options
        const formattedData = data
            .map(item => {
                // Skip if project name doesn't exist
                if (!item.project_name) {
                    return null;
                }

                // Check if this project name exists in our map
                const isAlreadyUsed = existingProjectMap.has(item.project_name);
                const usedFases = existingProjectMap.get(item.project_name) || new Set();

                // If project exists and has fase 0 or no fase, skip it entirely
                if (isAlreadyUsed && (!item.fase || Number(item.fase) === 0)) {
                    return null;
                }

                const dropdownFase = [];

                // Only process phases if fase value exists, is an integer, and greater than 0
                if (item.fase && Number.isInteger(Number(item.fase)) && Number(item.fase) > 0) {
                    // Only add phases that aren't already used for this project
                    for (let i = 1; i <= Number(item.fase); i++) {
                        // Convert i to string for consistent comparison
                        if (!usedFases.has(String(i))) {
                            dropdownFase.push({
                                value: i,
                                description: `Fase ${i}`
                            });
                        }
                    }
                }

                // Skip this item if all phases are already used
                if (dropdownFase.length === 0 && item.fase && Number(item.fase) > 0) {
                    return null;
                }

                return {
                    id: item.project_id,
                    name: item.project_name,
                    duration: item.duration,
                    po_id: item.po_id,
                    po_number: item.po_number,
                    isAlreadyUsed,
                    dropdownFase  // Contains only phases not yet used
                };
            })
            .filter(Boolean); // Remove null entries

        // Return all project data with properly filtered dropdown values
        return formattedData;
    }


    static async provideDelete({ poNumber }, AuthUser) {
        const existedPO = await PurchaseOrder.findByNumb(poNumber);
        if (existedPO === null) {
            throw new CustomError('failed delete data, data not found', 400)
        }

        const existedProject = await Project.findById(existedPO.project_id);
        if (existedProject !== null) {
            throw new CustomError('failed delete data, data is still reference to another relations', 400)
        }

        await PurchaseOrder.delete(poNumber);

        // Create activity log data
        const createLogs = await createLog(
            AuthUser.id,
            `Menghapus data dari tabel Project_Purchase_Orders: ${poNumber}`
        );
    }

    static async provideUpdate(bodyRequest, { poNumber }, AuthUser) {
        console.log('data_po_number',poNumber)
        const siteData = AuthUser.site || null;
        const existedPO = await PurchaseOrder.findByNumb(poNumber);
        if (!existedPO) {
            throw new CustomError('Failed update, data not found', 400);
        }

        const existedProject = await Project.findById(existedPO.project_id);

        const inputRequest = {
            po_number: poNumber,
            project_name: bodyRequest.project_name ?? existedPO.project_name,
            customer: bodyRequest.customer_id ?? existedPO.customer,
            duration: bodyRequest.duration ? Number(bodyRequest.duration) : existedPO.duration,
            project_type: bodyRequest.project_type ?? existedPO.project_type,
            po_date: bodyRequest.po_date ?? existedPO.po_date,
            updated_by: bodyRequest.updated_by ?? existedPO.updated_by,
            live_date: bodyRequest.live_date ?? existedPO.live_date,
            po_description: bodyRequest.po_description ?? existedPO.po_description,
            attachment: bodyRequest.attachment ?? existedPO.attachment,
            notification_receivers: bodyRequest.notification_receivers ?? existedPO.notification_receivers,
            fase: bodyRequest.fase ?? existedPO.fase,
            site: siteData ?? existedPO.site,
            checkpoint: Array.isArray(bodyRequest.checkpoint) && bodyRequest.checkpoint.length > 0 ? bodyRequest.checkpoint : []
        };


        if ((existedPO.po_id || existedPO.project_id)) {
            try {
                await PurchaseOrder.deleteCheckpoint(existedPO.po_id || existedPO.project_id)
            } catch (error) {
                throw new CustomError(`Failed to process delete data checkpoint : ${error}`, 400);
            }
        }

        if (inputRequest.checkpoint.length > 0) {
            try {
                await Promise.all(inputRequest.checkpoint.map(async (item) => {
                    const payloadCheckpoint = {
                        id: generateUuid(),
                        po_id: existedPO.po_id || existedPO.project_id,
                        description: item.description,
                        duedate: item.duedate,
                        payment: item.payment,
                        status: 'todo',
                        position: item.position
                    };

                    return PurchaseOrder.createCheckpoint(payloadCheckpoint);
                }));
            } catch (err) {
                throw new CustomError(`Failed to process checkpoint data : ${err}`, 400);
            }
        }

        await PurchaseOrder.update(inputRequest);

        if (existedProject) {
            const inputUpdateProject = {
                id: existedPO.project_id,
                name: bodyRequest.project_name ?? existedProject.name,
                description: existedProject.description,
                status: existedProject.status,
                substatus: existedProject.substatus,
                status_info: existedProject.status_info,
                start_date: existedProject.start_date,
                end_date: existedProject.end_date,
                updated_by: bodyRequest.updated_by ?? existedProject.updated_by,
                po_description: bodyRequest.po_description ?? existedProject.po_description,
                attachment: bodyRequest.attachment ?? existedProject.attachment,
                notification_receivers: bodyRequest.notification_receivers ?? existedProject.notification_receivers
            };

            await Project.update(inputUpdateProject);
        }

        // Create activity log data
        await createLog(AuthUser.id, `Memperbarui data di tabel Project_Purchase_Orders: ${inputRequest.po_number}`);

        let receivers = bodyRequest.notification_receivers ? bodyRequest.notification_receivers : existedPO.notification_receivers;
        receivers = receivers.split(',');

        for (const receiver of receivers) {
            const assignedUser = await User.findById(receiver);
            if (!assignedUser) {
                continue;
            }
            const updater = await User.findById(bodyRequest.updated_by ?? existedPO.updated_by);
            if (!updater) {
                throw new CustomError('failed update, updater not found', 400);
            }
            if (assignedUser.email) {
                await sendEmail({ email: assignedUser.email, message: `<b>PO UPDATED</b><br><br>A PO has been updated by <b>${updater.id}-${updater.name}</b> with PO Number <b>${poNumber}</b>.`, subject: "Updation Purchase Order" })
            }
            if (assignedUser.phone_number) {
                await sendWhatsAppMessage({ phone: assignedUser.phone_number, message: `❗ *PO UPDATED* ❗\n\nA New PO has been updated by *${updater.id}-${updater.name}* with PO Number *${poNumber}*.` })
            }
        }

    }
}

module.exports = PurchaseOrderService;