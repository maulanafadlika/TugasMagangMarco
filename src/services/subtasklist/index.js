const { SubtasklistModel, TaskListModel, ProjectStatusModel, UserModel, TimeframeModel, StatusModel } = require("../../models");
const { ResponseHandler, DateFormatter, createLog, CustomError, sendEmail, sendWhatsAppMessage } = require("../../utils");
const generatePadNumber = require("../../utils/generatePadNumber");
const TasklistService = require("../tasklist");

const Subtasklist = new SubtasklistModel();
const Tasklist = new TaskListModel();
const ProjectStatus = new ProjectStatusModel();
const User = new UserModel();
const Timeframe = new TimeframeModel();
const Status = new StatusModel()


class SubtaskListService {
    static async provideGetAll(tasklistCode) {
        tasklistCode = tasklistCode.toUpperCase();
        const data = await Subtasklist.findAll(tasklistCode);
        const dataResponse = data.map((item) => {
            return {
                kode: item.kode,
                title: item.title,
                description: item.description,
                attachment: item.attachment,
                assignee: item.assignee,
                assignee_id: item.assignee_id,
                status_id: item.status_id,
                status_name: item.status_name,
                project_id: item.project_id,
                project_name: item.project_name,
                created_by: item.created_by,
                created_by_name: item.created_by_name,
                startdate: item.startdate,
                duedate: item.duedate,
                startdate_parent: item.startdate_parent,
                duedate_parent: item.duedate_parent,
                mandays : item.mandays,
                is_done : item.is_done,
                is_todo : item.is_todo
            };
        });
        return dataResponse;
    }

    static async provideStore(bodyRequest, AuthUser) {
        const currentCount = await Subtasklist.getCountSubtakslist(bodyRequest.tasklist_id);

        console.log(bodyRequest);

        const currentTasklist = await Tasklist.findCode(bodyRequest.tasklist_id);
        if (currentTasklist === null) {
            throw new CustomError("failed store data, tasklist not found", 400)
        }


        const currentProjectStatus = await ProjectStatus.findByProjectId(currentTasklist.project_id);
        if (currentProjectStatus === null) {
            throw new CustomError("failed store data, project-status data not found", 400)
        }
        const status = currentProjectStatus.project_status.split(',');
  
        

        const generatorCodeId = generatePadNumber(parseInt(currentCount.count_data));
        const newCodeId = bodyRequest.tasklist_id + generatorCodeId.next().value;

        const currentUserAssigned = await User.findById(bodyRequest.assignee ?? currentTasklist.assignee_id);
        if (currentUserAssigned === null) {
            throw new CustomError('error, user assignee not found', 400)
        }

        const inputData = {
            kode: newCodeId,
            tasklist_id: bodyRequest.tasklist_id,
            title: bodyRequest.title,
            description: bodyRequest.description,
            attachment: bodyRequest.attachment,
            created_by: bodyRequest.created_by,
            assignee: currentUserAssigned.name,
            assignee_id: currentUserAssigned.id,
            startdate : bodyRequest.startdate,
            duedate: bodyRequest.duedate,
            status_id: bodyRequest.status_id !== "" ? bodyRequest.status_id : status[0],
            mandays: bodyRequest.mandays
        };
        console.log('input subtast',inputData);
        
        await Subtasklist.create(inputData);

        const newSubtasklist = await Subtasklist.findById(newCodeId);

        await this.#_sendNotification({
            email: currentUserAssigned.email,
            subjectEmail: `Assignment Sub-Task ${newSubtasklist.title} (sub-task code: ${newSubtasklist.kode}) from Project ${newSubtasklist.project_name}`,
            phoneNumber: currentUserAssigned.phone_number,
            whatsappMessage: `Dear Team, you are assigned to Sub-Task *${newSubtasklist.title}* (sub-task code: *${newSubtasklist.kode}*) from Project *${newSubtasklist.project_name}*`,
            emailmessage: `<p> Dear Team, </p>
            <p> you are assigned to Sub-Task <b>${newSubtasklist.title}</b> (sub-task code: <b>${newSubtasklist.kode}</b>) from Project <b>${newSubtasklist.project_name}</b> </p>
            <p><b>Description:</b><br>${newSubtasklist.description}</p>
            `
        })

        // start manipulation time frame
        const inputRequestTimeFrame = {
            project_id: currentTasklist.project_id,
            task_id: newCodeId,
            status_id: status[0],
            previous_status_id: null,
            start_time: DateFormatter.dateNow(),
            user_id: currentUserAssigned.id
        }
        await Timeframe.createNewTimeFrameAssignment(inputRequestTimeFrame);
        console.log('[INFO]: success store subtasklist timeframe');
        // end manipulation time frame 

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Menambahkan data baru ke tabel PM_Subtasklist: ${inputData.kode}`
        );
    }

    static async provideUpdate(bodyRequest, subtasklistCode, AuthUser) {
        const prevData = await Subtasklist.findById(subtasklistCode);
        if (prevData === null) {
            throw new CustomError("data not found", 400)
        }

        let latestAssigneeSubtask = null
        console.log('data asssigneee',bodyRequest.assignee);
        
        if (bodyRequest.assignee !== undefined) {
            latestAssigneeSubtask = await User.findById(bodyRequest.assignee);
            if (latestAssigneeSubtask === null) {
                throw new CustomError('failed update data, assignee data not found', 400)
            }
        }
 
        const inputRequest = {
            title: bodyRequest.title ?? prevData.title,
            description: bodyRequest.description ?? prevData.description,
            attachment: bodyRequest.attachment ?? prevData.attachment,
            assignee: latestAssigneeSubtask.name ?? bodyRequest.assignee,
            assignee_id : bodyRequest.assignee ?? prevData.assignee_id,
            codeId: subtasklistCode,
            startdate : bodyRequest.startdate ?? prevData.startdate,
            duedate: bodyRequest.duedate ?? prevData.duedate,
            status_id : bodyRequest.status_id?? prevData.status_id,
            mandays : bodyRequest.mandays?? prevData.mandays
        };

        await Subtasklist.update(inputRequest);

        const currentSubtask = await Subtasklist.findById(subtasklistCode);

        // start manipulation timeframe
        if (prevData.assignee_id !== bodyRequest.assignee && latestAssigneeSubtask !== null) {
            const updatedTime = DateFormatter.dateNow();

            const previousAssigneeSubtask = await User.findByName(latestAssigneeSubtask.name);
            const currentTasklist = await Tasklist.findCode(prevData.tasklist_id);

            await this.#_sendNotification({
                email: latestAssigneeSubtask.email,
                subjectEmail: `Assignment Sub-Task ${currentSubtask.title} (sub-task code: ${currentSubtask.kode}) from Project ${currentTasklist.project_name}`,
                phoneNumber: latestAssigneeSubtask.phone_number,
                whatsappMessage: `Dear Team, \nyou are assigned to Sub-Task *${currentSubtask.title}* (sub-task code: *${currentSubtask.kode}*) from Project *${currentTasklist.project_name}*`,
                emailmessage: `<p> Dear Team, </p>
                                <p> you are assigned to Sub-Task <b>${currentSubtask.title}</b> (sub-task code: <b>${currentSubtask.kode}</b>) from Project <b>${currentTasklist.project_name}</b> </p>
                                <p><b>Description:</b><br>${currentSubtask.description}</p>
                                `
            })

            const lastTimeframe = await Timeframe.findLastAssignment(prevData.kode, previousAssigneeSubtask.id);
            if (lastTimeframe !== null) {
                await Timeframe.updateAssignment(lastTimeframe.id, updatedTime);
            }

            const inputRequestTimeframe = {
                project_id: currentTasklist.project_id,
                task_id: prevData.kode,
                status_id: prevData.status_id,
                previous_status_id: prevData.status_id,
                start_time: updatedTime,
                user_id: latestAssigneeSubtask.id
            }
            await Timeframe.createNewTimeFrameAssignment(inputRequestTimeframe);

        }
        // end manipulation time frame

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Memperbarui data di tabel PM_Subtasklist: ${subtasklistCode}`
        );
    }


    static async provideDelete(bodyRequest, subtasklistCode, AuthUser) {
        const prevData = await Subtasklist.findById(subtasklistCode);
        if (prevData === null) {
            throw new CustomError("data not found", 400)
        }

        const inputRequest = {
            kode: subtasklistCode,
            is_active: bodyRequest.is_active
        };
        console.log('body request',inputRequest);
        // change is_active = 0
        await Subtasklist.delete(inputRequest);

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Change status active ${inputRequest.is_active} subtask data di tabel PM_SubTasklist: ${subtasklistCode}`
        );
    }

    static async provideUpdateStatus(subtasklistCode, statusId, AuthUser) {        
        const prevData = await Subtasklist.findById(subtasklistCode);
        if (prevData === null) {
            throw new CustomError("failed update status subtasklist, subtasklist not found", 400)
        }
        const inputStatus = statusId ?? prevData.status_id;
        const update = await Subtasklist.updateStatus(inputStatus, subtasklistCode);

        // start manipulation timeframe
        if (prevData.status_id !== statusId) {
            const updatedTime = DateFormatter.dateNow();

            const currentAssigneeSubtask = await User.findByName(prevData.assignee);
            const currentTasklist = await Tasklist.findCode(prevData.tasklist_id);
                  // Cek status mode
            const statusMode = await Status.findById(statusId)
            const lastTimeframe = await Timeframe.findLastAssignment(prevData.kode, currentAssigneeSubtask.id);
            if (lastTimeframe !== null) {
                const inputSyncronize = {
                    updated_time : updatedTime,
                    kode : subtasklistCode,
                    resolved_time : statusMode.mode === '2' ? updatedTime : prevData.resolved_time || null
                }
                await Timeframe.updateAssignment(lastTimeframe.id, updatedTime);
                await Subtasklist.syncronizeSubTaskTimeFrame(inputSyncronize)
            }

            const inputRequestTimeframe = {
                project_id: currentTasklist.project_id,
                task_id: prevData.kode,
                status_id: statusId,
                previous_status_id: prevData.status_id,
                start_time: updatedTime,
                user_id: currentAssigneeSubtask.id
            }
            await Timeframe.createNewTimeFrameAssignment(inputRequestTimeframe);

        }
        // end manipulation time frame

        // Create activity log data <-
        const createLogs = await createLog(
            AuthUser.id,
            `Memperbarui data status di tabel PM_Subtasklist: ${AuthUser.id} | ${inputStatus} (status_id)`
        );
    }

    static async provideUpdateAssignee(subtasklistCode, assigneeName, AuthUser) {
    const prevData = await Subtasklist.findById(subtasklistCode);
    if (prevData === null) {
        throw new CustomError("error update data, data subtasklist not found", 400)
    }

    console.log(assigneeName);
    console.log('prev data', prevData);

    const latestAssigneeSubtask = await User.findByName(assigneeName);
    if (latestAssigneeSubtask === null) {
        throw new CustomError('failed update data, user assignee not found', 400)
    }

    const inputAssignee = assigneeName ?? prevData.assignee;

    const update = await Subtasklist.udpateAssigne(inputAssignee, subtasklistCode);

    // start manipulation timeframe
    if (prevData.assignee != inputAssignee) {
        console.log('prev data',prevData.tasklist_id);
        
        const updatedTime = DateFormatter.dateNow();

        const previousAssigneeSubtask = await User.findByName(prevData.assignee);
        const currentTasklist = await Tasklist.findCode(prevData.tasklist_id);
        console.log('tasklist data', currentTasklist);
        
        // PENGECEKAN PENTING: Pastikan currentTasklist ada data
        if (currentTasklist === null) {
            throw new CustomError(`failed update data, tasklist with ID ${prevData.tasklist_id} not found`, 400);
        }

        // Pastikan properti project_name ada
        if (!currentTasklist.project_name) {
            throw new CustomError(`failed update data, project_name not found in tasklist ${prevData.tasklist_id}`, 400);
        }

        const lastTimeframe = await Timeframe.findLastAssignment(prevData.kode, previousAssigneeSubtask.id);
        if (lastTimeframe !== null) {
            await Timeframe.updateAssignment(lastTimeframe.id, updatedTime);
        }

        // Sekarang aman untuk menggunakan currentTasklist.project_name
        await this.#_sendNotification({
            email: latestAssigneeSubtask.email,
            subjectEmail: `Assignment Sub-Task ${prevData.title} (sub-task code: ${prevData.kode}) from Project ${currentTasklist.project_name}`,
            phoneNumber: latestAssigneeSubtask.phone_number,
            whatsappMessage: `Dear Team, \nyou are assigned to Sub-Task *${prevData.title}* (sub-task code: *${prevData.kode}*) from Project *${currentTasklist.project_name}*`,
            emailmessage: `<p> Dear Team, </p>
                        <p> you are assigned to Sub-Task <b>${prevData.title}</b> (sub-task code: <b>${prevData.kode}</b>) from Project <b>${currentTasklist.project_name}</b> </p>
                        <p><b>Description:</b><br>${prevData.description}</p>`
        })

        const inputRequestTimeframe = {
            project_id: currentTasklist.project_id,
            task_id: prevData.kode,
            status_id: prevData.status_id,
            previous_status_id: prevData.status_id,
            start_time: updatedTime,
            user_id: latestAssigneeSubtask.id
        }
        await Timeframe.createNewTimeFrameAssignment(inputRequestTimeframe);
    }
    // end manipulation time frame

    // Create activity log data
    const createLogs = await createLog(
        AuthUser.id,
        `Memperbarui data assignee di tabel PM_Subtasklist: ${subtasklistCode} | ${inputAssignee} (assignee)`
    );
}

    static async #_sendNotification({ email, subjectEmail, phoneNumber, whatsappMessage, emailmessage }) {
        if (email) {
            await sendEmail({
                email,
                subject: subjectEmail,
                message: emailmessage
            });
        }
        if (phoneNumber) {
            await sendWhatsAppMessage({
                phone: phoneNumber,
                message: whatsappMessage
            });
        }
    }
}

module.exports = SubtaskListService;