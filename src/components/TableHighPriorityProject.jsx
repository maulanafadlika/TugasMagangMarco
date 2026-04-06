import React, { useEffect, useState } from "react";
import { Typography, Card, CardBody, CardFooter, IconButton } from '@material-tailwind/react';
import { ArrowPathRoundedSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; 
import { formatDate } from "@/utils/helper";
import { apiRequest, processAndSetData } from "@/utils/api-helper";

export function TableHighPriorityProject() {
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchHighPriorityProjects();
    }, []);

  const fetchHighPriorityProjects = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/summary/high-priority-projects`;
    const data = await apiRequest(url);
    setIsLoading(false);
    processAndSetData(data?.data, setData);
  };

  const TABLE_HEAD = ['ID', 'Project Name', 'Start Date', 'End Date', 'Assignee Team'];

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Fungsi untuk berpindah halaman
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  // Filter data berdasarkan halaman saat ini
  const filteredRows = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage); // Hitung jumlah halaman

  return (
    <Card className="shadow-lg rounded-lg border border-gray-200">
      <CardBody className="overflow-x-auto p-4">
        <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
          <thead className="bg-blue-gray-50/50">
            <tr>
              {TABLE_HEAD.map((head) => (
                <th
                  key={head}
                  className="border border-gray-300 p-4 cursor-pointer relative"
                  onClick={head.toLowerCase() === 'actions' ? undefined : () => requestSort(head.toLowerCase().replace(' ', '_'))}
                >
                  <div className="flex items-center">
                    <Typography
                      variant="small"
                      color="blue-gray"
                      className="font-semibold leading-none opacity-70 font-poppins text-left text-xs"
                    >
                      {head}
                    </Typography>
                    {head.toLowerCase() !== 'actions' && (
                      <span
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                          sortConfig.key === head.toLowerCase().replace(' ', '_')
                            ? 'text-gray-500'
                            : 'text-gray-500'
                        }`}
                      >
                        <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
                      </span>
                    )}
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
              filteredRows.map((row, index) => (
                <tr key={index}>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{row.id}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{row.project_name}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{(formatDate(row.start_date))}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>{(formatDate(row.end_date))}</td>
                  <td className="text-xs py-4 border px-4" style={{ color: '#212529' }}>
                    {row.assignee_team.replace(/,/g, ', ')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={TABLE_HEAD.length} className="text-center py-4">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <MagnifyingGlassIcon className="h-16 w-16 mb-4 animate-bounce mt-4" />
                    <Typography className="font-poppins text-xl font-medium">Data Not Found!</Typography>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardBody>

      <CardFooter className="flex items-center justify-center border-t border-gray-300 p-4">
        <div className="flex items-center gap-2">
          {[...Array(totalPages)].map((_, i) => (
            <IconButton
              key={i}
              variant="outlined"
              size="sm"
              className={`rounded-lg ${
                i === currentPage - 1 ? 'border-black text-black' : 'border-none text-black'
              }`}
              onClick={() => handlePageChange(i + 1)}
              style={{
                borderColor: i === currentPage - 1 ? '#212121' : 'transparent',
                backgroundColor: 'transparent',
                color: i === currentPage - 1 ? '#212121' : '#212121',
                fontSize: '12px',
                lineHeight: '12px',
              }}
            >
              {i + 1}
            </IconButton>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}