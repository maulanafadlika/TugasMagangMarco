import React, { useEffect, useState, useMemo } from "react";
import ApexCharts from "react-apexcharts";
import { apiRequest } from "@/utils/api-helper";
import { green600, orange600, rose600, blue600, slate600, purple600 } from "@/utils/chart-colors";
import { TableHighPriorityProject } from "@/components/TableHighPriorityProject";
import { TableMilestoneProject } from "@/components/TableMilestoneProject";
import { ExclamationCircleIcon, ArrowTrendingUpIcon, CheckCircleIcon, RocketLaunchIcon, AcademicCapIcon, ChartPieIcon, MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { TableImplementationDashboard } from "@/components/TableImplementationMilestone";
import { Button, Input } from "@material-tailwind/react";
import { useDashboard } from "@/zustand";
import ModalProgres from "./HomeContent/ModalProgres";
import DetailStatus from "./HomeContent/DetailStatus";

export function Home() {
  const [assignmentProgressData, setAssignmentProgressData] = useState([]);
  const [projectProgressData, setProjectProgressData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const {openModal,setOpenModal,setDataProgres} = useDashboard()

  useEffect(() => {
    fetchAssignmentProgress();
    fetchProjectProgress();
  }, []);

  const fetchAssignmentProgress = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/assignment-progress`;
    const data = await apiRequest(url);
    setAssignmentProgressData(data?.data || []);
    setIsLoading(false);
  };

  const fetchProjectProgress = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/project-progress`;
    const data = await apiRequest(url);
    setProjectProgressData(data?.data || []);
    setIsLoading(false);
  };

  // Filter project progress data based on search query using useMemo
  const filteredProjectProgressData = useMemo(() => {
    if (!searchQuery.trim()) {
      return projectProgressData;
    }
    
    return projectProgressData.filter(project => 
      project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.project_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectProgressData, searchQuery]);

  const generatePieData = (statuses, isAssignment = false) => {
    const labels = statuses.map(status => status.status_name);
    const data = statuses.map(status => parseFloat(status.percentage.replace('%', '')));
  
    const colors = isAssignment 
      ? [rose600, blue600, green600, orange600, slate600, purple600]
      : [purple600, slate600, orange600, green600, blue600, rose600];
  
    return {
      series: data,
      options: {
        chart: {
          type: 'pie',
          height: 300,
        },
        labels: labels,
        colors: colors,
        legend: {
          show: false,
          position: 'bottom',
          fontSize: '11px',
          fontFamily: 'Poppins, sans-serif',
          labels: {
            colors: '#212529',
          },
          markers: {
            shape: 'square',
            size: 6,
            offsetX: -4,
          },
          itemMargin: {
            horizontal: 5,
            vertical: 5,
          },
        },
        tooltip: {
          y: {
            formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
          },
          style: {
            fontFamily: 'Poppins, sans-serif',
          },
        },
        dataLabels: {
          enabled: true,
          dropShadow: {
            enabled: false,
          },
          formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
          style: {
            fontFamily: 'Poppins, sans-serif',
            fontSize: '10px',
          },
          textAnchor: 'middle',
          offset: -10,
        },
        plotOptions: {
          pie: {
            dataLabels: {
              offset: -10,
              minAngleToShowLabel: 10,
            },
          },
        },
      }
    };
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '198px' }}>
        <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full" role="status">
        </div>
      </div>
    );
  }

  const handleOpenModal = (dataList)=>{
    console.log('data list',dataList)
    setOpenModal(!openModal)
    setDataProgres(dataList)
  }

  return (
    <div className="mt-4">
      {/* Section 1: Assignment Progress */}
      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <CheckCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">Assignment Progress</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-[80vh] overflow-y-auto gap-6">
          {assignmentProgressData.length > 0 ? assignmentProgressData.map((project) => {
            return (
              <div key={project.project_id} className="bg-white shadow-md p-4 rounded-lg">
                <h2 className="text-sm font-semibold mb-2 font-poppins border-b border-gray-300 pb-2" style={{ color: '#212529' }}>{project.project_name}</h2>
                <div className="flex justify-center relative">
                <div className="absolute z-10 right-0">
                    <Button
                      color="blue"
                      className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                      onClick={()=>handleOpenModal(project)}
                    >
                      <ChartPieIcon className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="w-48">
                  <ApexCharts
                    options={generatePieData(project.statuses, true).options} // true for Assignment Progress
                    series={generatePieData(project.statuses, true).series}
                    type="pie"
                    height={300}
                  />
                  </div>
                </div>
              </div>
            )
          }) : <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center bg-white p-4 rounded-lg shadow-sm font-poppins font-medium text-blue-gray-300">No Data Available</div>}
        </div>
      </div>

      {/* Section 2: Project Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <div className="flex justify-center items-center">
            <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-lg font-semibold font-poppins">Project Progress</h1>
          </div>
          <div className="w-72 font-poppins">
            <Input
              label="Search Projects"
              icon={<MagnifyingGlassIcon className="h-5 w-5" />}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-[80vh] overflow-y-auto gap-6">
          {filteredProjectProgressData.length > 0 ? filteredProjectProgressData.map((project) => (
            <div key={project.project_id} className="bg-white shadow-md p-4 rounded-lg">
              <h2 className="text-sm font-semibold mb-2 font-poppins border-b border-gray-300 pb-2" style={{ color: '#212529' }}>{project.project_name}</h2>
              <div className="flex justify-center relative">
                <div className="absolute z-10 right-0">
                    <Button
                      color="blue"
                      className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                      onClick={()=>handleOpenModal(project)}
                    >
                      <ChartPieIcon className="h-5 w-5" />
                    </Button>
                  </div>
                <div className="w-48">
                <ApexCharts
                    options={generatePieData(project.statuses, false).options} // false for Project Progress
                    series={generatePieData(project.statuses, false).series}
                    type="pie"
                    height={300}
                  />
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center bg-white p-4 rounded-lg shadow-sm font-poppins font-medium text-blue-gray-300">
              {searchQuery ? `No projects found matching "${searchQuery}"` : 'No Data Available'}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: High Priority */}
      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <ExclamationCircleIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">High Priority Project</h1>
        </div>
        <TableHighPriorityProject />
      </div>
      

      {/* Section 4: Milestone Project List */}
      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <RocketLaunchIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">Milestone Project</h1>
        </div>
        <TableMilestoneProject />
      </div>

      <div className="mb-6">
        <div className="flex items-center bg-white p-4 rounded-lg shadow-sm mb-4" style={{ color: '#212529' }}>
          <AcademicCapIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-lg font-semibold font-poppins">Implementation Project</h1>
        </div>
        <TableImplementationDashboard />
      </div>
      <ModalProgres/>
      <DetailStatus/>
    </div>
  );
}

export default Home;