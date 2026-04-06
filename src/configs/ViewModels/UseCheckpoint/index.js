import { useCallback, useState } from 'react';
import { ProjectCheckpoint } from '@/configs/models';

const UseCheckpoint = () => {
  // Combined loading state for better management
  const [loading, setLoading] = useState({
    fetchDataCheckpointLoading: false,
    fetchDataProjectAssignLoading: false,
  });
  
  // Data state
  const [dataCheckpoint, setDataCheckpoint] = useState({
    dataListCheckpoint: null,
    dataProjectAssign: null
  });

  // Fetch report assignment data
  const fetchDataCheckpoint = useCallback(async (projectId) => {
    // Update only the specific loading state we're changing
    setLoading(prev => ({ ...prev, fetchDataCheckpointLoading: true }));
    
    try {
      const response = await ProjectCheckpoint.getDataCheckpoint(projectId);
      setDataCheckpoint(prev => ({ ...prev, dataListCheckpoint: response }));
      return response; // Return the response for immediate use if needed
    } catch (error) {
      console.error('Error fetching data checkpoint:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchDataCheckpointLoading: false }));
    }
  }, []);

  // Fetch project assignment data
  const fetchDataProjectAssignment = useCallback(async (user_id) => {
    setLoading(prev => ({ ...prev, fetchDataProjectAssignLoading: true }));
    
    try {
      const response = await ProjectCheckpoint.getProjectAssignment(user_id);
      setDataCheckpoint(prev => ({ ...prev, dataProjectAssign: response }));
      return response; // Return the response for immediate use if needed
    } catch (error) {
      console.error('Error fetching data project assignment:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchDataProjectAssignLoading: false }));
    }
  }, []);

  return {
    dataCheckpoint,
    fetchDataCheckpoint,
    fetchDataProjectAssignment,
    loading,
  };
};

export default UseCheckpoint;