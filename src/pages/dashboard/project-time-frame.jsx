import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input, Option } from "@material-tailwind/react";
import { ArrowPathRoundedSquareIcon, DocumentChartBarIcon } from "@heroicons/react/24/solid";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import { ExcelExportButton } from "@/components/ExportExcelButton";
import Select from 'react-select';

const TABLE_HEAD = ["Project Id", "Project Name", "Previous Status Name", "Status Name", "Start Time", "End Time", "Duration", "Followed Up By"];

export function ProjectTimeFrame() {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'kode', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [projectKey, setProjectKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({ project_name: "", project_id: "", task_id: "", status_id: "", start_time: "", end_time: "", duration: "", followed_up_by: "" });

  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;

  useEffect(() => {
    fetchProjectAssignment();
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectTimeFrame();
    }
  }, [formData.project_id]);

  const fetchProjectAssignment = async () => {
    setIsLoading(true);
    try {
      const projectStatusData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/projects`, "GET");
      processAndSetData(projectStatusData, setProjectAssignment);
    } catch (error) {
      console.error("Error fetching project assignment: ", error);
    }
    setIsLoading(false);
  };
  
  const fetchProjectTimeFrame = async () => {
    setIsLoading(true);
    try {
      const reportData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/project-time-frame/${formData.project_id}`, "GET");
      processAndSetData(reportData, setTABLE_ROWS);
    } catch (error) {
      console.error("Error fetching report data: ", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };

  const highlightText = (text) => {
    if (typeof text !== 'string' || !searchQuery) return text;
  
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
    );
  };  
  
  const filterRows = (rows) => {
    if (!searchQuery) return rows;
  
    const query = searchQuery.toLowerCase();
  
    return rows.filter(row => {
      return Object.keys(row).some(key => {
        if (key === 'duration') {
          const durationString = `${row.duration.days}d ${row.duration.hours}h ${row.duration.minutes}m ${row.duration.seconds}s`;
          return durationString.toLowerCase().includes(query);
        }
        if (key === 'start_time' || key === 'end_time') {
          const dateValue = row[key] ? new Date(row[key]).toISOString() : '';
          return dateValue.toLowerCase().includes(query);
        }
        const value = row[key] ? row[key].toString().toLowerCase() : '';
        return value.includes(query);
      });
    });
  };  

  const sortedRows = useMemo(() => {
    if (!sortConfig) return [...TABLE_ROWS];
  
    const { key, direction } = sortConfig;
  
    return [...TABLE_ROWS].sort((a, b) => {
      let valueA = a[key];
      let valueB = b[key];
  
      // Handle N/A in date fields by converting them to null for sorting purposes
      if (key === 'end_time') {
        valueA = valueA === 'N/A' ? null : new Date(valueA);
        valueB = valueB === 'N/A' ? null : new Date(valueB);
      }
  
      // Convert duration strings into total seconds for comparison
      if (key === 'duration') {
        const toSeconds = (durationString) => {
          if (!durationString) return 0;
          const regex = /(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/;
          const matches = regex.exec(durationString);
          const days = parseInt(matches[1] || 0, 10) || 0;
          const hours = parseInt(matches[2] || 0, 10) || 0;
          const minutes = parseInt(matches[3] || 0, 10) || 0;
          const seconds = parseInt(matches[4] || 0, 10) || 0;
          return days * 86400 + hours * 3600 + minutes * 60 + seconds;
        };
        valueA = toSeconds(valueA);
        valueB = toSeconds(valueB);
      }
  
      // Default string comparison for other fields
      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();
  
      // Null checks for sorting: Nulls will always be considered smaller or larger based on direction
      if (valueA === null) return direction === 'ascending' ? -1 : 1;
      if (valueB === null) return direction === 'ascending' ? 1 : -1;
  
      if (valueA < valueB) return direction === 'ascending' ? -1 : 1;
      if (valueA > valueB) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [TABLE_ROWS, sortConfig]);
  

  const requestSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const getStatusBadgeStyle = (status) => {
    const styles = {
      NEW: { backgroundColor: 'rgba(255, 228, 225, 0.3)', color: '#ff6347' }, // Light coral for New
      'KICK OFF': { backgroundColor: 'rgba(255, 239, 213, 0.3)', color: '#ffb347' }, // Peach for Kickoff
      IMPLEMENTATION: { backgroundColor: 'rgba(245, 222, 179, 0.3)', color: '#c19a6b' }, // Darker tan for Implementation
      BAST: { backgroundColor: 'rgba(255, 218, 185, 0.3)', color: '#f08080' }, // Light pink for BAST
      INVOICING: { backgroundColor: 'rgba(230, 230, 250, 0.3)', color: '#9370db' }, // Soft lavender for Invoicing
      PAYMENT: { backgroundColor: 'rgba(240, 230, 140, 0.3)', color: '#b8860b' }, // Khaki for Payment
      COMPLETED: { backgroundColor: 'rgba(204, 230, 255, 0.3)', color: '#004085' }, // Light blue for Completed
      HOLD: { backgroundColor: 'rgba(255, 204, 204, 0.3)', color: '#f17171' }, // Light red for Hold
      'No Previous Status': { backgroundColor: 'rgba(255, 228, 196, 0.3)', color: '#d2691e' }, // Light orange for No Previous Status
    };
  
    return {
      ...styles[status],
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  };

  const idCount = {};
  const tableRows = currentPageData.map((row, index) => {
    const uniqueKey = idCount[row.project_id] ? `${row.project_id}-${idCount[row.project_id]}` : row.project_id;
    idCount[row.project_id] = (idCount[row.project_id] || 0) + 1;
  
    return (
      <tr key={uniqueKey} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className={`border border-gray-300 p-4`}>{highlightText(row.project_id)}</td>
        <td className={`border border-gray-300 p-4`}>{highlightText(row.project_name)}</td>
        <td className="border border-gray-300 p-4">
          {row.previous_status_id ? (
            <span style={getStatusBadgeStyle(row.previous_status_name)}>{highlightText(row.previous_status_name)}</span>
          ) : (
            <span style={getStatusBadgeStyle('No Previous Status')}>{highlightText('No Previous Status')}</span>
          )}
        </td>
        <td className="border border-gray-300 p-4">
          <span style={getStatusBadgeStyle(row.status_name)}>
            {highlightText(row.status_name)}
          </span>
        </td>
        <td className={`border border-gray-300 p-4`}>
          {highlightText(row.start_time ? ((row.start_time)).toLocaleString() : 'N/A')}
        </td>
        <td className={`border border-gray-300 p-4`}>
          {highlightText(row.end_time ? ((row.end_time)).toLocaleString() : 'N/A')}
        </td>
        <td className={`border border-gray-300 p-4`}>{highlightText(row.duration)}</td>
        <td className={`border border-gray-300 p-4`}>{highlightText(row.followed_up_by_name)}</td>
      </tr>
    );
  });
  
  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const handleProjectChange = (value) => {
    setSelectedReport(null);
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
    }));
    setProjectKey(prevKey => prevKey + 1);
  };

  const headers = [
    { label: 'project_id', key: 'project_id', width: 10 },
    { label: 'project_name', key: 'project_name', width: 20 },
    { label: 'status_id', key: 'status_id', width: 15 },
    { label: 'status_name', key: 'status_name', width: 15 },
    { label: 'previous_status_id', key: 'previous_status_id', width: 17 },
    { label: 'previous_status_name', key: 'previous_status_name', width: 17 },
    { label: 'start_time', key: 'start_time', width: 25 },
    { label: 'end_time', key: 'end_time', width: 25 },
    { label: 'duration', key: 'duration', width: 40 },
    { label: 'followed_up_by', key: 'followed_up_by', width: 15 },
  ];
  
  const projectOptions = projectAssignment.map((project) => ({
    value: project.id,
    label: project.project_name,
  }));

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );  

  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Project Time Frame
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <div className={`font-poppins w-72 py-2`}>
            <Select
                options={isLoading ? [{ value: '', label: <LoadingOption /> }] : projectOptions}
                value={projectOptions.find(option => option.value === formData.project_id) || null}
                onChange={(selectedOption) => {
                  handleProjectChange(selectedOption.value);
                  setProjectSelected(selectedOption !== null);
                }}
                isSearchable={true}
                placeholder="Project Name"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    width: '100%',
                    borderRadius: '7px',
                    padding: '2px',
                    fontSize: '14px',
                    borderColor: state.isFocused ? 'black' : '#B0BEC5',
                    boxShadow: state.isFocused ? '0 0 0 1px black' : base.boxShadow,
                    '&:hover': {
                      borderColor: state.isFocused ? 'black' : '#B0BEC5',
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: '7px',
                    padding: '12px 12px',
                  }),
                  option: (base, state) => ({
                    ...base,
                    borderRadius: '7px',
                    fontSize: '14px',
                    padding: '8px 12px',
                    backgroundColor: state.isSelected
                      ? '#2196F3'
                      : state.isFocused
                      ? '#E9F5FE'
                      : base.backgroundColor,
                    color: state.isSelected ? '#fff' : base.color,
                    ':active': {
                      ...base[':active'],
                      backgroundColor: state.isSelected ? '#2196F3' : '#E9F5FE',
                    },
                    ...(state.data.value === '' && {
                      backgroundColor: 'transparent', // No background for loading state
                      cursor: 'default', // No hover effect
                      ':hover': {
                        backgroundColor: 'transparent', // No hover effect
                      },
                    }),
                  }),
                }}
              />
            </div>
            {projectSelected && (
              <div className="flex items-center ml-4">
                <div className="w-72 font-poppins mr-4">
                  <Input
                    label="Search"
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <ExcelExportButton
                  projectId={formData.project_id || 'default-project-id'}
                  tableRows={TABLE_ROWS}
                  headers={headers}
                  isAssignment={false}
                />
              </div>
            )}

          </div>
        </CardHeader>

        <CardBody className="overflow-scroll px-0">
          {formData.project_id ? (
            <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
              <thead className="bg-blue-gray-50/50">
                <tr>
                {TABLE_HEAD.map((head) => (
                    <th
                      key={head}
                      className="border border-gray-300 p-4 cursor-pointer relative"
                      onClick={() => requestSort(head.toLowerCase().replace(/\s/g, '_'))}
                    >
                      <div className="flex items-center">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold leading-none opacity-70 font-poppins text-left text-xs"
                        >
                          {head}
                        </Typography>
                        <span
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sortConfig.key === head.toLowerCase().replace(' ', '_')
                              ? 'text-gray-500'
                              : 'text-gray-500'
                            }`}
                        >
                          <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="text-center py-10">
                      <div className="flex items-center justify-center">
                        <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredRows.length > 0 ? (
                  tableRows
                ) : (
                  <tr>
                    <td colSpan={TABLE_HEAD.length} className="text-center py-4">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <MagnifyingGlassIcon className="h-16 w-16 mb-4 animate-bounce mt-4" />
                        <Typography className="font-poppins text-xl font-medium">
                          Data Not Found!
                        </Typography>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500" style={{ padding: '45px' }}>
              <DocumentChartBarIcon className="h-16 w-16 mb-4 animate-bounce" />
              <Typography className="text-center font-poppins text-lg font-medium text-gray-500">
                Select a project to view the project time frame report
              </Typography>
            </div>
          )}
        </CardBody>

        <CardFooter className="flex items-center justify-center border-t border-blue-gray-50 p-4">
          <div className="flex items-center gap-2">
            {[...Array(pageCount)].map((_, i) => (
              <IconButton
                key={i}
                variant={i === currentPage ? "outlined" : "text"}
                size="sm"
                onClick={() => handlePageClick(i)}
              >
                {i + 1}
              </IconButton>
            ))}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}