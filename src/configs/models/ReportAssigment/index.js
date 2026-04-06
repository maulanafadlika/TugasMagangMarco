import { Network } from "../../../services";

const getDataReportAssignment = async (projectId) => {
  try {
    const response = await Network.GET(`/api/v1/report-assignment/${projectId}`);
    return Promise.resolve(response);
  } catch (e) {
    console.log("error data report assignment", e);
    return Promise.reject(e);
  }
};

const getProjectAssignment = async () => {
  try {
    const response = await Network.GET('/api/v1/project-status');
    return Promise.resolve(response);
  } catch (e) {
    console.log("error get project assignment", e);
    return Promise.reject(e);
  }
};


const getReportStatus = async (payload)=>{
  try {
      const response =  await Network.POST({ url: '/api/v1/get-status', method: 'POST', payload}); 
      return Promise.resolve(response)
  } catch (e) {
      console.log('error get report status',e)
      return Promise.reject(e)
  }

}

const editProject = async (payload)=>{
  try {
      const response =  await Network.POST({ url: '/editProject', method: 'POST', payload}); 
      return Promise.resolve(response)
  } catch (e) {
      console.log('error adit project',e)
      return Promise.reject(e)
  }

}

export { 
  getDataReportAssignment,
  getProjectAssignment,
  getReportStatus
};
