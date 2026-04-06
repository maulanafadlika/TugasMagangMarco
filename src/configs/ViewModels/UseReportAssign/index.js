import { useCallback, useState } from 'react';
import { ReportAssigment } from '@/configs/models';

const UseReportAssign = () => {
  // Combined loading state for better management
  const [loading, setLoading] = useState({
    fetchDataReportAssignLoading: false,
    fetchDataProjectAssignLoading: false,
    fetchDataReportStatusLoading: false,
  });
  
  // Data state
  const [dataReport, setDataReport] = useState({
    dataReportAssign: null,
    dataProjectAssign: null,
    dataReportStatus : null
  });

  // Fetch report assignment data
  const fetchDataReportAssignment = useCallback(async (projectId) => {
    // Update only the specific loading state we're changing
    setLoading(prev => ({ ...prev, fetchDataReportAssignLoading: true }));
    
    try {
      const response = await ReportAssigment.getDataReportAssignment(projectId);
      setDataReport(prev => ({ ...prev, dataReportAssign: response }));
      return response; // Return the response for immediate use if needed
    } catch (error) {
      console.error('Error fetching data report assignment:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchDataReportAssignLoading: false }));
    }
  }, []);

  // Fetch project assignment data
  const fetchDataProjectAssignment = useCallback(async () => {
    setLoading(prev => ({ ...prev, fetchDataProjectAssignLoading: true }));
    
    try {
      const response = await ReportAssigment.getProjectAssignment();
      setDataReport(prev => ({ ...prev, dataProjectAssign: response }));
      return response; // Return the response for immediate use if needed
    } catch (error) {
      console.error('Error fetching data project assignment:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchDataProjectAssignLoading: false }));
    }
  }, []);

  const fetchDataReportStatus = useCallback(async (payload) => {
    setLoading(prev => ({ ...prev, fetchDataReportStatusLoading: true }));
    
    try {
      const response = await ReportAssigment.getReportStatus(payload);
      setDataReport(prev => ({ ...prev, dataProjectAssign: response }));
      return response; // Return the response for immediate use if needed
    } catch (error) {
      console.error('Error fetching data report status:', error);
      return null;
    } finally {
      setLoading(prev => ({ ...prev, fetchDataReportStatusLoading: false }));
    }
  }, []);

  return {
    dataReport,
    fetchDataReportAssignment,
    fetchDataProjectAssignment,
    fetchDataReportStatus,
    loading,
  };
};

export default UseReportAssign;