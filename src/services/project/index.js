
const { ProjectModel, TimeframeModel, ParameterModel, ProjectAssignmentModel, PurchaseOrderModel } = require("../../models");
const { ResponseHandler, createLog, CustomError, generateProjectId } = require("../../utils");
const { DateFormatter } = require('../../utils');

const Project = new ProjectModel();
const Timeframe = new TimeframeModel();
const ParameterStatus = new ParameterModel();
const ProjectAssigment = new ProjectAssignmentModel();
const PurchaseOrder = new PurchaseOrderModel()

class ProjectService {

    static async provideGetUnassignedProjects() {
        const allProjects = await Project.findAll();
        // console.log('data all project',allProjects);
        const assignedProjects = await ProjectAssigment.findProjectId();

        if (!Array.isArray(assignedProjects)) {
            throw new Error('assignedProjects should be an array');
        }

        // Membuat set dari project IDs yang sudah ada di assignment
        const assignedProjectIds = new Set(assignedProjects.map(project => project.project_id));
        //  console.log('data asigned',assignedProjectIds);
        // Filter proyek yang tidak ada di assignedProjectIds
        const unassignedProjects = allProjects.filter(project => !assignedProjectIds.has(project.id));
        // console.log('data unsigned',unassignedProjects);
        
        const formattedData = unassignedProjects.map(project => ({
            id: project.id,
            name: project.project_name,
        }));

        return formattedData;
    }

    static async provideStore(bodyRequest, AuthUser) {
        // const existedData = await Project.findById(bodyRequest.id);
        // if (existedData) {
        //     throw new CustomError("failed create new data, duplication id of data", 400);
        // }
        // let existedData
        // if(bodyRequest.id.startsWith('PRJ')){
        //     existedData = await Project.findById(bodyRequest.id);
        // } else {
        //     existedData = await PurchaseOrder.findByPoId(bodyRequest.id);
        // }
        // console.log('existed data',existedData);
        
        // if (existedData) {
        //     throw new CustomError("failed create new data, duplication PO Id", 400);
        // }

        
        if (!bodyRequest.pm_id || String(bodyRequest.pm_id).trim() === "") {
            throw new CustomError("pm_id field is required", 400);
        }

        let inputRequest = {
            id: await generateProjectId('PRJ'),
            project_name : bodyRequest.project_name,
            name: bodyRequest.name,
            description: bodyRequest.description,
            status: bodyRequest.status,
            substatus: bodyRequest.substatus || null,
            status_info: bodyRequest.status_info || null,
            start_date: bodyRequest.start_date,
            end_date: bodyRequest.end_date,
            created_by: bodyRequest.created_by,
            updated_by: bodyRequest.created_by,
            fase : bodyRequest.fase || 0,
            division : bodyRequest.division,
            pm_id: bodyRequest.pm_id
        };

        const dataPO = await PurchaseOrder.findAll();
        const filterPO = dataPO.find((item) => item.po_number === bodyRequest.po_number);
        
        // Initialize updatePOpayload
        let updatePOpayload = {
            project_id: inputRequest.id, // This will be modified to handle multiple IDs
            updated_by: bodyRequest.updated_by,
            po_number: bodyRequest.po_number
        };
        
        // Handle multiple project IDs
        if (Array.isArray(inputRequest.id)) {
            // If inputRequest.id is already an array, join it with commas
            updatePOpayload.project_id = inputRequest.id.join(',');
        } else if (typeof inputRequest.id === 'string' && inputRequest.id.includes(',')) {
            // If inputRequest.id is already a comma-separated string, use it as is
            updatePOpayload.project_id = inputRequest.id;
        } else {
            // Convert single ID to string format
            updatePOpayload.project_id = String(inputRequest.id);
        }
        
        // Fix the syntax error in the original code and maintain the conditional logic
        if (filterPO && filterPO.fase > 0) {
            // If there's existing project_id in filterPO, append it to our list
            let existingIds = [];
            
            if (filterPO.project_id) {
                if (typeof filterPO.project_id === 'string') {
                    existingIds = filterPO.project_id.split(',');
                } else if (Array.isArray(filterPO.project_id)) {
                    existingIds = filterPO.project_id;
                } else {
                    existingIds = [filterPO.project_id];
                }
            } else if (filterPO.po_id) {
                if (typeof filterPO.po_id === 'string') {
                    existingIds = filterPO.po_id.split(',');
                } else if (Array.isArray(filterPO.po_id)) {
                    existingIds = filterPO.po_id;
                } else {
                    existingIds = [filterPO.po_id];
                }
            }
        
            // Add the new ID(s) if they don't exist yet
            const newIds = updatePOpayload.project_id.split(',');
            const combinedIds = [...new Set([...existingIds, ...newIds])];
            
            updatePOpayload.project_id = combinedIds.join(',');
        }
        
        if(filterPO){
            inputRequest = {
                ...inputRequest,
                po_id : filterPO.po_id
            }
        }
        await Project.create(inputRequest);
        await PurchaseOrder.updateDataPO(updatePOpayload)
        // start time frame manipulation //
        const projectParameterStatus = await ParameterStatus.findByData(bodyRequest.status);
        const inputRequestTimeFrame = {
            project_id: inputRequest.id,
            previous_status_id: null,
            status_id: projectParameterStatus.id,
            start_time: DateFormatter.dateNow(),
            user_id: bodyRequest.created_by,
        };
        await Timeframe.createProjectTimeframe(inputRequestTimeFrame);
        // end time frame manipulation //

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Menambahkan data baru ke tabel PM_Project: ${bodyRequest.id}`
        );
    }

    static async provideGetAll() {
        const data = await Project.findAll();
        const formattedData = data.map(row => ({
            ...row,
            created_time: DateFormatter.formatDate(row.created_time),
            updated_time: DateFormatter.formatDate(row.updated_time)
        }));

        return formattedData;
    }

    static async provideGetProjectWithMostTodoTasks() {
        const topProject = await Project.findTopProjectByTodoTasks();

        return topProject;
    }

    static async provideUpdate(bodyRequest, projectId, AuthUser) {
        const prevData = await Project.findById(projectId);
        if (!prevData) {
            throw new CustomError("data not found", 400)
        }
        if (bodyRequest.status !== undefined) {
            const foundedParameter = await ParameterStatus.findByData(bodyRequest.status);
            if (foundedParameter === null) {
                throw new CustomError('parameter status not found', 400)
            }
        }

        const inputRequest = {
            id: projectId,
            name: bodyRequest.name ?? prevData.name,
            description: bodyRequest.description ?? prevData.description,
            status: bodyRequest.status ?? prevData.status,
            substatus: bodyRequest.substatus ?? prevData.substatus,
            status_info: bodyRequest.status_info ?? prevData.status_info,
            start_date: bodyRequest.start_date ?? prevData.start_date,
            end_date: bodyRequest.end_date ?? prevData.end_date,
            updated_by: bodyRequest.updated_by ?? prevData.updated_by,
            project_name: bodyRequest.project_name ?? prevData.project_name,
            division: bodyRequest.division ?? prevData.division,
            pm_id: bodyRequest.pm_id ?? prevData.pm_id ?? prevData.created_by,
        };
        console.log('payloadddd',inputRequest)
        await Project.update(inputRequest);

        // start time frame manipulation //
        if ((bodyRequest.status !== undefined && prevData.status !== bodyRequest.status) || (bodyRequest.updated_by !== undefined && prevData.updated_by !== bodyRequest.updated_by)) {
            const updatedTime = DateFormatter.dateNow()

            const previousTimeframe = await Timeframe.findLastProjectTimeframe(prevData.id);
            if (previousTimeframe !== null) {
                await Timeframe.updateProjectEndTime(previousTimeframe.id, updatedTime);
            }

            const previousProjectStatus = await ParameterStatus.findByData(prevData.status);
            const latestProjectStatus = await ParameterStatus.findByData(bodyRequest.status) ?? null;

            const inputRequestTimeFrame = {
                project_id: prevData.id,
                previous_status_id: previousProjectStatus.id,
                status_id: latestProjectStatus !== null ? latestProjectStatus.id : previousProjectStatus.id,
                start_time: updatedTime,
                user_id: (bodyRequest.updated_by !== undefined) ? bodyRequest.updated_by : (previousTimeframe === null ? prevData.updated_by : previousTimeframe.user_id)
            }
            await Timeframe.createProjectTimeframe(inputRequestTimeFrame);
            console.log('[INFO]: success create new time frame');
        }
        // end time frame manipulation //

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Memperbarui data di tabel PM_Project: ${inputRequest.id}`
        );
    }

    static async provideDelete(projectId, AuthUser) {
        const existedProject = await Project.findById(projectId);
        if (!existedProject) {
            throw new CustomError("Failed delete data, data not found", 400)
        }

        const existedProjectAssignment = await ProjectAssigment.findFirstByProjectId(projectId);
        if (existedProjectAssignment !== null) {
            throw new CustomError('failed delete data, data is still reference to another relations', 400)
        }

        await Project.delete(projectId);

        // Create activity log data
        const createLogs = await createLog(
            AuthUser.id,
            `Menghapus data dari tabel PM_Project: ${projectId}`
        );
    }

    static async provideGetDetail(projectId) {
        const existedProject = await Project.findById(projectId);
        if (!existedProject) {
            throw new CustomError("Failed get detail data, data not found", 400)
        }
        return existedProject
    }
    
}

module.exports = ProjectService;