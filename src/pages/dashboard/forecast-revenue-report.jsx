import React, { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, FileText, TrendingUp, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { apiRequest } from '@/utils/api-helper';
import { ExcelExportButton } from '@/components/ExportExcelButton';

const RevenueReportDashboard = () => {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('1');
  const [expandedRow, setExpandedRow] = useState(null);
  const [reportData, setReportData] = useState({
    data_report: [],
    data_detail: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Generate year options (last 3 years + current + next year)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 3; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  };

  // Month options
  const monthOptions = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Table Headers Configuration
  const tableHeaders = [
    { label: 'Project Info', align: 'left' },
    { label: 'Client', align: 'left' },
    { label: 'Sales', align: 'left' },
    { label: 'Status', align: 'left' },
    { label: 'Total Revenue', align: 'right' },
    { label: 'Action', align: 'center' }
  ];

  const processData = (responseData, defaultValue = []) => {
    if (responseData && Array.isArray(responseData)) {
      return responseData.length === 0 ? defaultValue : responseData;
    } else if (responseData?.data && Array.isArray(responseData.data)) {
      return responseData.data.length === 0 ? defaultValue : responseData.data;
    } else {
      console.error("Received data is not an array or missing 'data' property:", responseData);
      return defaultValue;
    }
  };

  const fetchReportRevenue = useCallback(async () => {
    setIsLoading(true);
    try {

      const baseUrl = `${import.meta.env.VITE_BASE_URL}/api/v1/forecast-principal/report-revenue`;
      const url = `${baseUrl}?year=${selectedYear}&month=${selectedMonth}`;

      const response = await apiRequest(url);
      console.log('responseee', response)
      setReportData({
        data_report: processData(response.data?.data_report),
        data_detail: processData(response.data?.data_detail)
      });

    } catch (error) {
      console.error("Error fetching report revenue:", error);
      setReportData({
        data_report: [],
        data_detail: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchReportRevenue();
  }, [fetchReportRevenue]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRow(null);
  }, [selectedYear, selectedMonth]);

  // Get summary data from API response
  const summaryData = reportData.data_report[0] || {
    month: '',
    month_name: '',
    total_po: '0',
    total_revenue: 0,
    total_discount: 0,
    total_project_nominal: '0'
  };

  // Data untuk Chart - Revenue by Sales
  const salesChartData = (reportData.data_detail || []).reduce((acc, item) => {
    const existing = acc.find(x => x.name === item.sales_name);
    if (existing) {
      existing.value += parseFloat(item.total_price) || 0;
    } else {
      acc.push({
        name: item.sales_name,
        value: parseFloat(item.total_price) || 0
      });
    }
    return acc;
  }, []);


const categoryChartData = (reportData.data_detail || []).reduce((acc, item) => {

  if (!item.project_category) {
    return acc;
  }
  
  const existing = acc.find(x => x.name === item.project_category);
  if (existing) {
    existing.value += parseFloat(item.total_price) || 0;
  } else {
    acc.push({
      name: item.project_category,
      value: parseFloat(item.total_price) || 0
    });
  }
  return acc;
}, []);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (reportData.data_detail || []).slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil((reportData.data_detail || []).length / itemsPerPage);

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedRow(null);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
    setExpandedRow(null);
  };

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'new_project': 'bg-blue-100 text-blue-800',
      'active': 'bg-green-100 text-green-800',
      'pipeline': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleExportExcel = () => {
    console.log('Exporting to Excel...', { year: selectedYear, month: selectedMonth });
    alert('Export functionality will be implemented here');
  };
  const headerData = [
    { label: 'Sales Name', key: 'sales_name', width: 15 },
    { label: 'Company SI', key: 'company_si', width: 15 },
    { label: 'Customer', key: 'customer', width: 15 },
    { label: 'Customer Type', key: 'customer_type', width: 15 },
    { label: 'Project Name', key: 'project_name', width: 20 },
    { label: 'Project Category', key: 'project_category', width: 18 },
    { label: 'PO Number', key: 'po_number', width: 18 },
    { label: 'PO Type', key: 'po_type', width: 15 },
    { label: 'Product Category', key: 'product_category', width: 18 },
    { label: 'Status', key: 'status', width: 15 },
    { label: 'Source', key: 'source', width: 15 },
    { label: 'Project Nominal', key: 'project_nominal', width: 18 },
    { label: 'Discount', key: 'discount', width: 12 },
    { label: 'Total Price', key: 'total_price', width: 18 },
    { label: 'Start Periode', key: 'start_periode', width: 18 },
    { label: 'End Periode', key: 'end_periode', width: 18 },
    { label: 'Target Month', key: 'target_month', width: 15 }
  ];

  const formatedTableRows = reportData.data_detail?.map(row => ({
    ...row,
    start_periode: formatDate(row.start_periode, true),
    end_periode: formatDate(row.end_periode, true)
  }));
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <Calendar className="text-gray-400" size={20} />

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {generateYearOptions().map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthOptions.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>


          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                  <DollarSign className="text-green-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.total_revenue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{summaryData.month_name}</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Jumlah PO</span>
                  <FileText className="text-blue-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {summaryData.total_po}
                </div>
                <p className="text-xs text-gray-500 mt-1">Purchase Orders</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Diskon</span>
                  <TrendingUp className="text-orange-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.total_discount)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryData.total_project_nominal > 0
                    ? `${((summaryData.total_discount / parseFloat(summaryData.total_project_nominal)) * 100).toFixed(1)}% dari nominal`
                    : '0% dari nominal'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Nominal Project</span>
                  <DollarSign className="text-purple-600" size={20} />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(summaryData.total_project_nominal))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Sebelum diskon</p>
              </div>
            </div>

            {/* Charts Section */}
            {(reportData.data_detail || []).length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue by Sales */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Sales</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue by Category */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detail Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Detail Projects</h3>

                <ExcelExportButton
                  revenueReport={{ report: true, year: selectedYear, month: selectedMonth }}
                  tableRows={formatedTableRows}
                  headers={headerData}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th
                          key={index}
                          className={`px-6 py-3 text-${header.align} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                        >
                          {header.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No data available for selected period
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{item.project_name}</div>
                              <div className="text-sm text-gray-500">{item.po_number}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{item.customer}</div>
                              <div className="text-sm text-gray-500 capitalize">{item.customer_type?.replace('_', ' ')}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{item.sales_name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(item.status)}`}>
                                {item.status?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                              {formatCurrency(item.total_price)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {expandedRow === index ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                              </button>
                            </td>
                          </tr>
                          {expandedRow === index && (
                            <tr>
                              <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">SI Company:</span>
                                    <p className="text-gray-900 capitalize">{item.company_si}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Category:</span>
                                    <p className="text-gray-900 capitalize">{item.project_category}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Product:</span>
                                    <p className="text-gray-900 capitalize">{item.product_category?.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">PO Type:</span>
                                    <p className="text-gray-900 capitalize">{item.po_type?.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Source:</span>
                                    <p className="text-gray-900 uppercase">{item.source}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Nominal:</span>
                                    <p className="text-gray-900">{formatCurrency(item.project_nominal)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Discount:</span>
                                    <p className="text-gray-900">{item.discount}%</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Start Period:</span>
                                    <p className="text-gray-900">{formatDate(item.start_periode)}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">End Period:</span>
                                    <p className="text-gray-900">{formatDate(item.end_periode)}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(reportData.data_detail || []).length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, (reportData.data_detail || []).length)}
                    </span>{' '}
                    of <span className="font-medium">{(reportData.data_detail || []).length}</span> results
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                      Next
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <span className="text-sm text-gray-600">entries</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RevenueReportDashboard;