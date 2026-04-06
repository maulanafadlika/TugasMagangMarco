import { Network } from "../../../services";

const getDataCheckpoint = async (projectId) => {
  try {
    const response = await Network.GET(`/api/v1/project-checkpoint/${projectId}`);
    return Promise.resolve(response);
  } catch (e) {
    console.log("error data checkpoint", e);
    return Promise.reject(e);
  }
};

const getProjectAssignment = async (user_id) => {
  try {
    const response = await Network.GET(`/api/v1/project-assignee/${user_id}`);
    return Promise.resolve(response);
  } catch (e) {
    console.log("error get project assignment", e);
    return Promise.reject(e);
  }
};


const addProject = async (payload)=>{
  try {
      const response =  await Network.POST({ url: '/addProject', method: 'POST', payload}); 
      return Promise.resolve(response)
  } catch (e) {
      console.log('error add project',e)
      return Promise.reject(e)
  }

}

const editCheckpoint = async (payload)=>{
  try {
      const response =  await Network.POST({ url: '/api/v1/project-checkpoint', method: 'PUT', payload}); 
      return Promise.resolve(response)
  } catch (e) {
      console.log('error adit project',e)
      return Promise.reject(e)
  }

}

export { 
  getDataCheckpoint,
  getProjectAssignment,
  editCheckpoint
};
