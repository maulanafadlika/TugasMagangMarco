import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, CardBody, CardFooter, IconButton, Input, Option } from "@material-tailwind/react";
import { DocumentChartBarIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import { ExcelExportButton } from "@/components/ExportExcelButton";
import Select from 'react-select';
import { UseCheckpoint, UseReportAssign } from "@/configs/ViewModels";
import { formatDate } from "@/utils/helper";
import Cookies from 'js-cookie';
import { decryptPayload } from "@/services/codec/codec";
import ModalEditCheckpoint from "./CheckpointContent/ModalEditCheckpoint";

const TABLE_HEAD = [
                        "Action",
                        "PO Number",
                        "Project Id",
                        "Project Name",
                        "Description",
                        "Duedate",
                        "Relate Payment",
                        "Status",
                        "Note"
                    ];

const  ProjectCheckpoint = ()=> {
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'task_id', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [projectKey, setProjectKey] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({ note : "", status : "",duedate : "",id : "" });
  const {dataReport,fetchDataProjectAssignment,loading,fetchDataCheckpoint} = UseCheckpoint()
  const [isOpen,setIsOpen] = useState(false)
  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;
  const [decryptedUserId, decryptedUserName] = [Cookies.get('USER_ID'), Cookies.get('NAME')].map(decryptPayload);

    useEffect(() => {
        const fetchProject = async () => {
            const result = await fetchDataProjectAssignment(decryptedUserId);
            if (result) {
            setProjectAssignment(result.data);
            }
        };
        
        fetchProject();
    }, []);

    useEffect(() => {
        if(formData.project_id){
        const fetchReport = async () => {
            const result = await fetchDataCheckpoint(formData.project_id);
            if(result.data){
                setTABLE_ROWS(result.data)
            }
            
        };
        
        fetchReport();
        }
     
    }, [formData.project_id]);



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
  
        const dateFields = ['duedate'];

        if (dateFields.includes(key)) {
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

  console.log(TABLE_ROWS)
  const getStatusBadgeStyle = (statusName) => {
    const baseStyle = {
      borderRadius: '5px',
      padding: '4px 10px',
      display: 'inline-block',
      marginRight: '4px',
    };
  
    const styles = {
      'DONE': ['rgba(212, 237, 218, 0.3)', '#67b173'],
      'COMPLETE': ['rgba(204, 230, 255, 0.3)', '#004085'],
      'UAT': ['rgba(255, 239, 179, 0.3)', '#856404'],
      'TODO': ['rgba(226, 227, 229, 0.3)', '#383d41'],
      'IN_PROGRESS': ['rgba(255, 255, 204, 0.3)', '#f4c542'],
      'SIT': ['rgba(248, 215, 218, 0.3)', '#f17171'],
      'No Previous Status': ['rgba(255, 228, 196, 0.3)', '#d2691e'],
    };
  
    const [backgroundColor, color] = styles[statusName] || ['rgba(226, 227, 229, 0.3)', '#383d41'];
  
    return { ...baseStyle, backgroundColor, color };
  };  
  
  const idCount = {};
  const tableRows = currentPageData.map((row, index) => {
    const uniqueKey = idCount[row.issue_code] ? `${row.issue_code}-${idCount[row.issue_code]}` : row.issue_code;
    idCount[row.issue_code] = (idCount[row.issue_code] || 0) + 1;
  
const handleEdit = (id) => {
  const checkpoint = TABLE_ROWS.find((check) => check.id === id);
  if (checkpoint) {
    setFormData({
      status: checkpoint.status,
      duedate: formatDate(checkpoint.duedate),
      note: checkpoint.note || "",
      project_id: checkpoint.project_id,
      id: id
    });
        
    setIsOpen(true);
  }
};


    return (
      <tr key={uniqueKey} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        <td className="border border-gray-300 p-2">
          <div className="flex justify-center items-center">
            <IconButton variant="text" color="blue" onClick={() => handleEdit(row.id)}>
              <PencilIcon className="h-5 w-5" />
            </IconButton>
          </div>
        </td>
        <td className="border border-gray-300 p-4">{highlightText(row.po_number)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.project_id)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.project_name)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.description)}</td>
        <td className="border border-gray-300 p-4">{highlightText(formatDate(row.duedate))}</td>
        <td className="border border-gray-300 text-center">{highlightText(row.payment ? '✅' : '❌')}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.status)}</td>
        <td className="border border-gray-300 p-4">{highlightText(row.note)}</td>
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
    { label: 'PO Number', key: 'po_number', width: 15 },
    { label: 'Project Id', key: 'project_id', width: 15 },
    { label: 'Project Name', key: 'project_name', width: 15 },
    { label: 'Description', key: 'description', width: 15 },
    { label: 'Due Date', key: 'duedate', width: 20 },
    { label: 'Related Payment', key: 'payment', width: 15 },
    { label: 'Status', key: 'status', width: 15 },
    { label: 'Note', key: 'note', width: 15 },
  ];

  const projectOptions = projectAssignment.map((project) => ({
    value: project.project_id,
    label: project.project_name,
  }));

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );  


    const formatedTableRows = TABLE_ROWS.map(row => ({
        ...row,
        duedate: formatDate(row.duedate),
        payment : row.payment ? '✅' : '❌'
    }));


  console.log('formated table rows',formatedTableRows)
  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Project Checkpoint
            </Typography>
          </div>
          <div className="flex items-center justify-between">
            <div className={`font-poppins w-72 py-2`}>
              <Select
                options={loading.fetchDataProjectAssignLoading ? [{ value: '', label: <LoadingOption /> }] : projectOptions}
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
                  tableRows={formatedTableRows}
                  headers={headers}
                  customName={`${formData.project_id}_Project_Checkpoint`}
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
                {loading.fetchDataCheckpointLoading ? (
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
                Select a project to view the assignment time frame report
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
      <ModalEditCheckpoint 
        setIsOpen={setIsOpen} 
        isOpen={isOpen} 
        setFormData={setFormData} 
        formData = {formData} 
        setTABLE_ROWS={setTABLE_ROWS}
        TABLE_ROWS = {TABLE_ROWS}
      />
      
    </>
  );
}


export default ProjectCheckpoint