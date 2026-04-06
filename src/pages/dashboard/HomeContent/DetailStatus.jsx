import { useDashboard } from "@/zustand";
import React, { useEffect, useMemo, useState } from "react";
import ApexCharts from "react-apexcharts";
import {
  green600,
  orange600,
  rose600,
  blue600,
  slate600,
  purple600,
} from "@/utils/chart-colors";
import {
  Card,
  CardHeader,
  Typography,
  Button,
  CardBody,
  CardFooter,
  IconButton,
  Input,
  Textarea,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Option,
  MaterialSelect,
} from "@material-tailwind/react";
import { MagnifyingGlassIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { formatDate } from "@/utils/helper";
import { UseReportAssign } from "@/configs/ViewModels";

const DetailStatus = () => {
  const { openDetail, setOpenDetail, payloadStatus,dataProgres,currentPage, setCurrentPage } = useDashboard();
  // const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: "kode",
    direction: "ascending",
  });
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { fetchDataReportStatus } = UseReportAssign()
      useEffect(() => {
          if(payloadStatus.project_id){
          const fetchReport = async () => {
              const result = await fetchDataReportStatus(payloadStatus);
              if(result.data){
                  setTABLE_ROWS(result.data)
              }
              
          };
          
          fetchReport();
          }
       
      }, [payloadStatus.project_id,payloadStatus.status_id]);

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  console.log('TABEL ROWS',TABLE_ROWS)
  const [isLoading, setIsLoading] = useState(false);
  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;
  const TABLE_HEAD = [
    "Issue Type",
    "Issue Code",
    "Summary",
    "Assignee",
    "Created By",
    "Start Date",
    "Due Date",
    "Parent Task",
    "Status",
  ];

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

//   console.log('payloadstatus',payloadStatus)

  const filterRows = (rows) => {
    if (!searchQuery) return rows;

    const query = searchQuery.toLowerCase();

    return rows.filter((row) => {
      const formattedDueDate = row.duedate
        ? formatDate(row.duedate).toLowerCase()
        : "";
      const formattedStartDate = row.startdate
        ? formatDate(row.startdate).toLowerCase()
        : "";

      const fieldsToSearch = [
        "issue_type",
        "issue_code",
        "summary",
        "assignee",
        "created_by",
        "startdate",
        "duedate",
        "main_task",
        "status"
      ];

      return fieldsToSearch.some((key) => {
        const value = row[key];
        if (key === "duedate") return formattedDueDate.includes(query);
        if (key === "startdate") return formattedStartDate.includes(query);
        return value && value.toString().toLowerCase().includes(query);
      });
    });
  };

  const sortedRows = useMemo(() => {
    let filteredByStatus = [...TABLE_ROWS];

    if (!sortConfig) return filteredByStatus;

    const { key, direction } = sortConfig;

    const fieldMapping = {
      status: "status",
      start_date: "startdate",
      end_date: "duedate",
    };

    return filteredByStatus.sort((a, b) => {
      const actualKey = fieldMapping[key] || key;
      const aValue = a[actualKey];
      const bValue = b[actualKey];

      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [TABLE_ROWS, sortConfig]);

  const highlightText = (text) => {
    if (typeof text !== "string" || !searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-300">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };
  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);
  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);

  const tableRows = currentPageData.map((row) => {
    const tdPadding = isLoading ? "p-4" : "p-2";

    return (
      <tr
        key={row.kode}
        className="border-b border-gray-200 font-poppins text-xs"
        style={{ color: "#212529" }}
      >
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.issue_type)}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.issue_code)}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.summary)}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.assignee)}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.created_by)}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(formatDate(row.startdate, true))}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(formatDate(row.duedate, true))}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(formatDate(row.main_task, true))}
        </td>
        <td className={`border border-gray-300 ${tdPadding}`}>
          {highlightText(row.status)}
        </td>
      </tr>
    );
  });

  return (
    <Dialog
      open={openDetail}
      handler={() => {}}
      dismiss={{
        outsidePointerDown: false,
        escapeKeyDown: false,
      }}
      style={{ height: "90vh" }}
      size="xl"
    >
      <DialogHeader className="font-poppins flex justify-between items-center text-xl font-semibold">
        {dataProgres.project_name} ({payloadStatus.status_name})
        <Button
          variant="text"
          color="red"
          onClick={() => setOpenDetail(false)}
          className="mr-2"
        >
          <XCircleIcon className="h-5 w-5" />
        </Button>
      </DialogHeader>
      <DialogBody divider className="max-h-[800px] overflow-hidden w-full">
        <div className="h-[70vh] w-full flex justify-between">
          <Card className="h-full w-full mt-4">
            <CardHeader
              floated={false}
              shadow={false}
              className="rounded-none overflow-visible flex justify-end"
            >
              <div className="w-72 font-poppins">
                <Input
                  label="Search"
                  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </CardHeader>

            <CardBody className="px-0 mt-5">
              {/* Container dengan tinggi tetap untuk scrollable area */}
              <div className="overflow-auto max-h-[45vh] border border-gray-300">
                <table className="w-full min-w-max table-auto text-left font-poppins">
                  <thead className="bg-blue-gray-50 sticky top-[-1px] z-10">
                    <tr>
                      {TABLE_HEAD.map((head, index) => {
                        return (
                          <th
                            key={head}
                            className="border border-gray-300 p-4 cursor-pointer relative bg-blue-gray-50/50"
                          >
                            <div className="flex items-center">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-semibold leading-none opacity-70 font-poppins text-left text-xs"
                              >
                                {head}
                              </Typography>
                              {head.toLowerCase() !== "actions" && (
                                <span
                                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                                    sortConfig.key ===
                                    head.toLowerCase().replace(" ", "_")
                                      ? "text-gray-500"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <i
                                    className={`fa fa-sort-${
                                      sortConfig.direction === "ascending"
                                        ? "up"
                                        : "down"
                                    }`}
                                  ></i>
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={TABLE_HEAD.length}
                          className="text-center py-10"
                        >
                          <div className="flex items-center justify-center">
                            <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredRows.length > 0 ? (
                      // Render tableRows di sini
                      currentPageData.map((row) => {
                        const tdPadding = isLoading ? "p-4" : "p-2";

                        return (
                          <tr
                            key={row.kode}
                            className="border-b border-gray-200 font-poppins text-xs"
                            style={{ color: "#212529" }}
                          >
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.issue_type)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.issue_code)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.summary)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.assignee)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.created_by)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(formatDate(row.startdate, true))}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(formatDate(row.duedate, true))}
                            </td>
                                <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.main_task)}
                            </td>
                            <td className={`border border-gray-300 ${tdPadding}`}>
                              {highlightText(row.status)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEAD.length}
                          className="text-center py-4"
                        >
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
              </div>
            </CardBody>

            <CardFooter className="flex items-center justify-center border-t border-blue-gray-50 p-4">
              <div className="flex items-center gap-2">
                {/* Previous button */}
                <IconButton
                  variant="text"
                  size="sm"
                  onClick={() => handlePageClick(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <span className="sr-only">Previous</span>
                  &laquo;
                </IconButton>

                {(() => {
                  const maxButtons = 10;
                  const pages = [];

                  if (pageCount > maxButtons) {
                    pages.push(
                      <IconButton
                        key={0}
                        variant={currentPage === 0 ? "outlined" : "text"}
                        size="sm"
                        onClick={() => handlePageClick(0)}
                      >
                        1
                      </IconButton>,
                    );

                    let startPage = Math.max(
                      1,
                      currentPage - Math.floor((maxButtons - 4) / 2),
                    );
                    let endPage = Math.min(
                      pageCount - 2,
                      startPage + maxButtons - 5,
                    );

                    if (endPage === pageCount - 2) {
                      startPage = Math.max(1, endPage - (maxButtons - 5));
                    }

                    if (startPage > 1) {
                      pages.push(<span key="ellipsis1">...</span>);
                    }

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <IconButton
                          key={i}
                          variant={i === currentPage ? "outlined" : "text"}
                          size="sm"
                          onClick={() => handlePageClick(i)}
                        >
                          {i + 1}
                        </IconButton>,
                      );
                    }

                    if (endPage < pageCount - 2) {
                      pages.push(<span key="ellipsis2">...</span>);
                    }

                    pages.push(
                      <IconButton
                        key={pageCount - 1}
                        variant={
                          currentPage === pageCount - 1 ? "outlined" : "text"
                        }
                        size="sm"
                        onClick={() => handlePageClick(pageCount - 1)}
                      >
                        {pageCount}
                      </IconButton>,
                    );
                  } else {
                    for (let i = 0; i < pageCount; i++) {
                      pages.push(
                        <IconButton
                          key={i}
                          variant={i === currentPage ? "outlined" : "text"}
                          size="sm"
                          onClick={() => handlePageClick(i)}
                        >
                          {i + 1}
                        </IconButton>,
                      );
                    }
                  }

                  return pages;
                })()}

                <IconButton
                  variant="text"
                  size="sm"
                  onClick={() =>
                    handlePageClick(Math.min(pageCount - 1, currentPage + 1))
                  }
                  disabled={currentPage === pageCount - 1}
                >
                  <span className="sr-only">Next</span>
                  &raquo;
                </IconButton>
              </div>
            </CardFooter>
          </Card>
        </div>
      </DialogBody>
    </Dialog>
  );
};

export default DetailStatus;
