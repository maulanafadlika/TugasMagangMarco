import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon, PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, Select as MaterialSelect } from "@material-tailwind/react";
import NotificationDialog from "@/components/NotificationDialog";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { formatDate, capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';
import { useDropzone } from 'react-dropzone';
import ForecastCheckpoint from "@/components/ForecastCheckpoint";
import DateTimeRangePicker from "@/components/DateTimeRangePicker";
import CreateOrder from "./ForecastContent/CreateOrder";
import { AiFillMoneyCollect } from "react-icons/ai";
import { HandCoinsIcon } from "lucide-react";
import { useForecast } from "@/zustand";
import { set } from "date-fns";



const TABLE_HEAD = ["Action", "Sales Name", "Source", "Company SI", "Customer", "Customer Type", "Product Category", "PO Type", "Status", "Project Name", "Project Category", "PO Number", "Project Nominal (IDR)", "Discount(%)", "Total Price (IDR)", "Periode", "Created By", "Created Time", "Updated By", "Updated Time"];

const PER_PAGE = 10;

// Memoize styles untuk react-select
const getSelectStyles = () => ({
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
        backgroundColor: state.isSelected ? '#2196F3' : state.isFocused ? '#E9F5FE' : base.backgroundColor,
        color: state.isSelected ? '#fff' : base.color,
        ':active': {
            ...base[':active'],
            backgroundColor: state.isSelected ? '#2196F3' : '#E9F5FE',
        },
    }),
});
export function ForecastPrincipal() {
    const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [isOrder, setIsOrder] = useState(false)
    const [formData, setFormData] = useState({ id: "", sales_name: "", status: "", source: "", company_si: "", customer: "", customer_type: "", product_category: "", po_type: "", project_name: "", project_category: "", total_price: "", po_number: "", project_nominal: "", discount: "", start_periode: "", end_periode: "", start_time_Periode: "09:00", end_time_periode: "17:00", checkpoint: [{ position: 1, description: '', duedate: '', termint_payment: 0, status_payment: '' }] });
    const [param, setParameter] = useState({
        source: [],
        companySi: [],
        customerType: [],
        productCategory: [],
        poType: [],
        forecastStatus: [],
        projectCategory: [],
        statusPayment: []
    });
    const [customer, setCustomer] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', isError: false });
    const [sortConfig, setSortConfig] = useState({ key: 'sales_name', direction: 'descending' });
    const [filesEvent, setFilesEvent] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [user, setUser] = useState([]);
    const [userMap, setUserMap] = useState({});
    const { setOrderData, setParamValues } = useForecast()


    const PER_PAGE = 10;
    const offset = currentPage * PER_PAGE;

    useEffect(() => {
        fetchForecastPrincipal()
        fetchUsers()
        fetchParameter()
        fetchCustomers()
    }, []);

    const pembulatanBIAtas = useCallback((nominal) => {
        if (!Number.isInteger(nominal)) {
            return Math.ceil(nominal);
        }
        return nominal;
    }, []);


    const formatIDR = useCallback((number) => {
        const numValue = typeof number === 'string' ? parseFloat(number) : number;
        return new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numValue || 0);
    }, []);

    const fetchUsers = async () => {
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/sales`);
            if (responseData && Array.isArray(responseData.data)) {
                const newUserMap = {};
                responseData.data.forEach(user => {
                    newUserMap[user.id] = user.name;
                });
                setUserMap(newUserMap);
                setUser(responseData.data);
                setParamValues({
                    sales_name_data: responseData.data
                })
            } else {
                console.error("Received users data is not an array or missing 'data' property: ", responseData);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchForecastPrincipal = async () => {
        setIsLoading(true);
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/forecast-principal`);
            console.log('forecast data', responseData);
            processAndSetData(responseData, setTABLE_ROWS);
        } catch (error) {
            console.error("Error fetching forecast data:", error);
        } finally {
            setIsLoading(false);
        }
    };

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

    const fetchParameter = useCallback(async () => {
        try {
            const paramIds = {
                source: 'SOURCE',
                companySi: 'COMPANY_SI',
                customerType: 'CUST_TYPE',
                productCategory: 'PRD_CTG',
                poType: 'PO_TYPE',
                forecastStatus: 'FRC_STATS',
                projectCategory: 'PRJ_CATEGORY',
                statusPayment: 'STATS_PAY'
            };

            const baseUrl = `${import.meta.env.VITE_BASE_URL}/api/v1/forecast-principal/parameters?param_id=`;

            const [
                responseSource,
                responseCompanySi,
                responseCustomerType,
                responseProductCategory,
                responsePoType,
                responseForecastStatus,
                responseProjectCategory,
                responseStatusPayment
            ] = await Promise.all([
                apiRequest(`${baseUrl}${paramIds.source}`),
                apiRequest(`${baseUrl}${paramIds.companySi}`),
                apiRequest(`${baseUrl}${paramIds.customerType}`),
                apiRequest(`${baseUrl}${paramIds.productCategory}`),
                apiRequest(`${baseUrl}${paramIds.poType}`),
                apiRequest(`${baseUrl}${paramIds.forecastStatus}`),
                apiRequest(`${baseUrl}${paramIds.projectCategory}`),
                apiRequest(`${baseUrl}${paramIds.statusPayment}`)
            ]);
            console.log('status payment', responseStatusPayment)
            setParameter({
                source: processData(responseSource),
                companySi: processData(responseCompanySi),
                customerType: processData(responseCustomerType),
                productCategory: processData(responseProductCategory),
                poType: processData(responsePoType),
                forecastStatus: processData(responseForecastStatus),
                projectCategory: processData(responseProjectCategory),
                statusPayment: processData(responseStatusPayment)
            });
            setParamValues({
                status_payment_data: processData(responseStatusPayment),
                source_data: processData(responseSource),
                company_si_data: processData(responseCompanySi),
                customer_type_data: processData(responseCustomerType),
                product_category_data: processData(responseProductCategory),
                po_type_data: processData(responsePoType),
                forecast_status_data: processData(responseForecastStatus),
                project_category_data: processData(responseProjectCategory),
            })

        } catch (error) {
            console.error("Error fetching parameters:", error);
            setParameter({
                source: [],
                companySi: [],
                customerType: [],
                productCategory: [],
                poType: [],
                forecastStatus: [],
                projectCategory: [],
                statusPayment: []
            });
        }
    }, []);


    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/customer`);
            processAndSetData(responseData, setCustomer);

            // Fix: Set customer_data ke paramValues
            if (responseData && Array.isArray(responseData.data)) {
                setParamValues({
                    customer_data: responseData.data
                });
            }
        } catch (error) {
            console.error("Error fetching customers: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    // const handleSearch = (event) => {
    //     setSearchQuery(event.target.value);
    // };

    // function handlePageClick(pageNumber) {
    //     setCurrentPage(pageNumber);
    // }

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;

        if (name === 'project_nominal' || name === 'total_price') {
            const cleanValue = value.replace(/\./g, '').replace(/[^0-9,]/g, '').replace(',', '.');
            const parts = cleanValue.split('.');
            if (parts.length <= 2) {
                setFormData(prev => ({ ...prev, [name]: cleanValue }));
            }
        } else if (name === 'discount') {
            let numericValue = value.replace(/[^0-9.]/g, '');

            if (numericValue === '') {
                setFormData(prev => ({ ...prev, [name]: '' }));
                return;
            }

            const parts = numericValue.split('.');
            if (parts.length > 2) return;

            if (numericValue.endsWith('.')) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
                return;
            }

            const floatValue = parseFloat(numericValue);
            if (!isNaN(floatValue) && floatValue <= 100) {
                setFormData(prev => ({ ...prev, [name]: numericValue }));
            } else if (!isNaN(floatValue) && floatValue > 100) {
                setFormData(prev => ({ ...prev, [name]: '100' }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    // const formatIDR = (number) => {
    //     const numValue = typeof number === 'string' ? parseFloat(number) : number;

    //     return new Intl.NumberFormat('id-ID', {
    //         style: 'decimal',
    //         minimumFractionDigits: 0,
    //         maximumFractionDigits: 2  // Ubah ke 2 untuk support desimal
    //     }).format(numValue || 0);
    // };

    // const uploadFilePurchaseOrder = async (filesEvent, formData, token, isEditing) => {
    //     const uploadFormData = new FormData();

    //     if (isEditing && formData.attachment) {
    //         uploadFormData.append('oldFile', formData.attachment);
    //     }

    //     const file = filesEvent[0];
    //     if (file) {
    //         uploadFormData.append('objectFiles', file);
    //     } else {
    //         throw new Error('No file selected for upload');
    //     }

    //     const url = isEditing
    //         ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
    //         : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`;

    //     const response = await fetch(url, {
    //         headers: {
    //             "Authorization": `Bearer ${token}`,
    //         },
    //         method: "POST",
    //         body: uploadFormData,
    //     });

    //     if (!response.ok) throw new Error('File upload failed');

    //     const uploadData = await response.json();
    //     const decryptedUploadData = decryptPayload(uploadData.msg);
    //     const uploadObjectData = JSON.parse(decryptedUploadData);

    //     if (uploadObjectData.status !== 'success' || !uploadObjectData.data || !uploadObjectData.data.filename) {
    //         throw new Error('File upload failed: Missing filename in response');
    //     }
    //     setFilesEvent([]);
    //     return uploadObjectData.data.filename;
    // };



    const handleSubmit = async () => {
        try {
            const token = Cookies.get('TOKEN');
            const rawUserId = Cookies.get('USER_ID');
            const siteType = Cookies.get('SITE_TYPE') || null
            const decryptedUserId = decryptPayload(rawUserId);
            const decryptedSiteType = siteType ? decryptPayload(siteType) : null;
            console.log('siteee',decryptedSiteType)
            // let fileName = formData.attachment || "";
            // const isFileChanged = filesEvent.length > 0 && (
            //     !formData.attachment ||
            //     !filesEvent.every(file => formData.attachment.includes(file.name))
            // );

            // if (isFileChanged) {
            //     fileName = await uploadFilePurchaseOrder(filesEvent, formData, token, isEditing);
            // }

            // if (!/^\d+$/.test(formData.fase)) {
            //     setNotification({
            //         open: true,
            //         message: 'Nilai fase harus bilangan bulat dan minimal 0',
            //         isError: true,
            //     });
            //     return;
            // }

            const prepareCheckpointForSubmission = (checkpoints) => {
                // console.log('sadadsad', checkpoints);

                if (!Array.isArray(checkpoints) || checkpoints.length === 0 || checkpoints[0] === undefined) {
                    return '[]';
                }

                const isAllEmpty = checkpoints.every(cp =>
                    cp?.description === '' &&
                    cp?.duedate === '' &&
                    cp?.payment_temnint === 0 &&
                    cp?.persentase === 0 &&
                    cp?.mode === 'persentase'
                );

                if (isAllEmpty) {
                    return '[]';
                }
                const result = checkpoints
                return result;
            };



            const dataToSend = {
                ...formData,
                start_periode: formatDate(formData.start_periode, true, true),
                end_periode: formatDate(formData.end_periode, true, true),
                discount: formData.discount,
                created_by: decryptedUserId,
                updated_by: isEditing ? decryptedUserId : undefined,
                site: decryptedSiteType || null,
                checkpoint: formData.checkpoint ? prepareCheckpointForSubmission(formData.checkpoint) : '[]'
            };

            // console.log('dataToSend:', dataToSend);

            // return

            const method = isEditing ? "PUT" : "POST";
            const endpoint = isEditing
                ? `/api/v1/forecast-principal/${formData.id}/edit`
                : "/api/v1/forecast-principal/store";


            const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                method: method,
                body: JSON.stringify({ msg: encryptPayload(JSON.stringify(dataToSend)) }),
            });

            const statusCode = response.status;
            const data = await response.json();
            const decryptedData = decryptPayload(data.msg);
            const objectData = JSON.parse(decryptedData);

            const message = capitalizeWords(objectData.message) || `Data ${isEditing ? 'updated' : 'added'} successfully!`;

            if (statusCode == 500) {
                // Jika status code 500 (Error server)
                setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
            } else if (statusCode >= 400 && statusCode < 500) {
                // Jika status code selain 500, misalnya 400 (Warning)
                setNotification({ open: true, message: message || 'A Warning Occurred.', isError: false, isWarning: true });
            } else if (statusCode === 200) {
                // Untuk status sukses
                setNotification({ open: true, message, isError: false });
                setIsOpen(false);
                setIsEditing(false);
                setFormData({ sales_name: "", source: "", status: "", company_si: "", customer: "", customer_type: "", product_category: "", po_type: "", project_name: "", project_category: "", po_number: "", project_nominal: "" });
                await fetchForecastPrincipal();
            } else {
                setNotification({ open: true, message: message || 'An Error Occurred While Saving The Data.', isError: true });
            }
        } catch (error) {
            console.error("Error saving data: ", error);
            setNotification({ open: true, message: 'An Unexpected Error Occurred. Please Try Again Later.', isError: true });
        }
    };

    const handleEdit = useCallback((fr_id) => {
        const project = TABLE_ROWS.find((project) => project.id === fr_id);
        if (project) {
            const nominal = parseFloat(project.project_nominal) || 0;
            const discount = parseFloat(project.discount) || 0;
            const calculatedTotal = pembulatanBIAtas(nominal - (nominal * discount / 100));

            setFormData({
                id: project.id,
                sales_name: project.sales_id,
                project_name: project.project_name,
                project_category: project.project_category,
                customer_type: project.customer_type,
                status: project.status,
                product_category: project.product_category,
                po_type: project.po_type,
                company_si: project.company_si,
                source: project.source,
                customer: project.customer,
                po_number: project.po_number,
                project_nominal: project.project_nominal,
                discount: project.discount,
                total_price: project.total_price || calculatedTotal.toString(),
                start_periode: project.start_periode,
                end_periode: project.end_periode,
                checkpoint: Array.isArray(project.checkpoint) && project.checkpoint.length > 0
                    ? project.checkpoint.map((c, index) => ({
                        position: index + 1,
                        description: c.description || '',
                        duedate: formatDate(c.duedate, false, false, true) || '',
                        termint_payment: c.termint_payment || 0,
                        persentase: c.persentase || 0,
                        mode: c.mode || '',
                        status_payment: c.status_payment || ''
                    }))
                    : [{ position: 1, description: '', duedate: '', termint_payment: 0, persentase: 0, mode: 'percentage', status_payment: '' }]
            });

            setIsEditing(true);
            setIsOpen(true);
        }
    }, [TABLE_ROWS, pembulatanBIAtas]);

    const handleDelete = useCallback((po_number) => {
        setDeleteId(po_number);
        setConfirmDelete(true);
    }, []);

    const handleOrder = useCallback((id) => {
        const project = TABLE_ROWS.find((project) => project.id === id);
        if (project) {
            const nominal = parseFloat(project.project_nominal) || 0;
            const discount = parseFloat(project.discount) || 0;
            const calculatedTotal = pembulatanBIAtas(nominal - (nominal * discount / 100));
            setIsOrder(true)
            setOrderData({
                id: project.id,
                sales_name: project.sales_id,
                project_name: project.project_name,
                project_category: project.project_category,
                customer_type: project.customer_type,
                status: project.status,
                product_category: project.product_category,
                po_type: project.po_type,
                company_si: project.company_si,
                source: project.source,
                customer: project.customer,
                po_number: project.po_number,
                project_nominal: project.project_nominal,
                discount: project.discount,
                total_price: project.total_price || calculatedTotal.toString(),
                start_periode: project.start_periode,
                end_periode: project.end_periode,
                checkpoint: Array.isArray(project.checkpoint) && project.checkpoint.length > 0
                    ? project.checkpoint.map((c, index) => ({
                        position: index + 1,
                        description: c.description || '',
                        duedate: formatDate(c.duedate, false, false, true) || '',
                        termint_payment: c.termint_payment || 0,
                        persentase: c.persentase || 0,
                        mode: c.mode || '',
                        status_payment: c.status_payment || ''
                    }))
                    : [{ position: 1, description: '', duedate: '', termint_payment: 0, persentase: 0, mode: 'percentage', status_payment: '' }]
            });
        }

    }, [TABLE_ROWS, pembulatanBIAtas]);


    const confirmDeletion = async () => {
        const token = Cookies.get('TOKEN');

        try {
            const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/v1/forecast-principal/${deleteId}/delete`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                method: "DELETE",
            });

            const data = await response.json();
            const decryptedData = decryptPayload(data.msg);
            const objectData = JSON.parse(decryptedData);

            const message = capitalizeWords(objectData.message) || 'Data deleted successfully!';
            if (objectData.status === "success") {
                setNotification({ open: true, message, isError: false });
                await fetchForecastPrincipal();
            } else {
                setNotification({ open: true, message: message || 'An error occurred while deleting the data.', isError: true });
            }
        } catch (error) {
            console.error('Error:', error);
            setNotification({ open: true, message: 'An unexpected error occurred. Please try again later.', isError: true });
        } finally {
            setDeleteId(null);
            setConfirmDelete(false);
        }
    };

    const highlightText = useCallback((text) => {
        if (!searchQuery || typeof text !== 'string' && typeof text !== 'number') return text;

        const textString = text.toString();
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return textString.split(regex).map((part, index) =>
            regex.test(part) ? <mark key={index} className="bg-yellow-300">{part}</mark> : part
        );
    }, [searchQuery]);


    const filteredRows = useMemo(() => {
        if (!searchQuery) return TABLE_ROWS;

        const query = searchQuery.toLowerCase();
        const fields = [
            'sales_name', 'source_name', 'status_name', 'company_si_name',
            'customer_name', 'customer_type_name', 'product_category_name',
            'po_type_name', 'project_name', 'project_category_name',
            'po_number', 'project_nominal'
        ];

        return TABLE_ROWS.filter(row => {
            const matchFields = fields.some(field => {
                const value = row[field] ? row[field].toString().toLowerCase() : '';
                return value.includes(query);
            });

            const createdTime = row.created_time ? formatDate(row.created_time).toLowerCase() : '';
            const updatedTime = row.updated_time ? formatDate(row.updated_time).toLowerCase() : '';
            const matchDate = createdTime.includes(query) || updatedTime.includes(query);

            return matchFields || matchDate;
        });
    }, [TABLE_ROWS, searchQuery]);

    const sortedRows = useMemo(() => {
        if (!sortConfig) return [...filteredRows];

        const { key, direction } = sortConfig;
        return [...filteredRows].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (direction === 'ascending' ? 1 : -1);
        });
    }, [filteredRows, sortConfig]);


    const currentPageData = useMemo(() =>
        sortedRows.slice(offset, offset + PER_PAGE),
        [sortedRows, offset]
    );

    const pageCount = Math.ceil(sortedRows.length / PER_PAGE);

    const handleSearch = useCallback((event) => {
        setSearchQuery(event.target.value);
    }, []);

    const handlePageClick = useCallback((pageNumber) => {
        setCurrentPage(pageNumber);
    }, []);

    const requestSort = useCallback((key) => {
        if (key === 'actions') return;

        setSortConfig(prev => {
            const direction = (prev && prev.key === key && prev.direction === 'ascending') ? 'descending' : 'ascending';
            return { key, direction };
        });
    }, []);

    // const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);

    const getStatusBadgeStyle = (status) => {
        const styles = {
            'CHANGE REQUEST': { backgroundColor: 'rgba(255, 255, 204, 0.3)', color: '#f4c542' }, // Light yellow for On Progress
            'MAINTANANCE': { backgroundColor: 'rgba(255, 204, 204, 0.3)', color: '#f17171' }, // Light red for Hold
            'NEW PROJECT': { backgroundColor: 'rgba(212, 237, 218, 0.3)', color: '#67b173' }, // Light green for Done
        };

        return {
            ...styles[status],
            borderRadius: '5px',
            padding: '4px 10px',
            display: 'inline-block',
            marginRight: '4px',
        };
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            setFilesEvent((prevFiles) => [...prevFiles, ...acceptedFiles]);
        },
    });

    const removeFile = (fileName) => {
        setFilesEvent((prevFiles) =>
            prevFiles.filter((file) => file.name !== fileName)
        );
    };


    const customerOptions = useMemo(() =>
        customer.map(c => ({
            value: c.id,
            label: `${c.name} - ${c.id}`,
        })), [customer]
    );

    const salesNameOpt = useMemo(() =>
        user.map(item => ({
            value: item.id,
            label: item.name,
        })), [user]
    );


    useEffect(() => {
        const nominal = parseFloat(formData.project_nominal) || 0;
        const discount = parseFloat(formData.discount) || 0;
        const calculatedTotal = pembulatanBIAtas(nominal - (nominal * discount / 100));
        if (formData.total_price !== calculatedTotal.toString()) {
            setFormData(prev => ({
                ...prev,
                total_price: calculatedTotal.toString()
            }));
        }
    }, [formData.project_nominal, formData.discount]);

    return (
        <>
            <Card className="h-full w-full mt-4">
                <CardHeader floated={false} shadow={false} className="rounded-none">
                    <div className="mb-6 border-b border-gray-300 pb-3">
                        <Typography className="font-poppins text-sm font-medium text-gray-600">
                            Forecast Principle Data
                        </Typography>
                    </div>
                    <div className="flex items-center justify-between">
                        <Button
                            color="blue"
                            className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    sales_name: "", source: "", status: "", company_si: "",
                                    customer: "", customer_type: "", product_category: "",
                                    po_type: "", project_name: "", project_category: "",
                                    po_number: "", project_nominal: "", discount: "", total_price: "",
                                    checkpoint: [{ position: 1, description: '', duedate: '', termint_payment: 0 }]
                                });
                                setIsOpen(true);
                            }}
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add
                        </Button>
                        <div className="w-72 font-poppins">
                            <Input
                                label="Search"
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="overflow-scroll px-0">
                    <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
                        <thead className="bg-blue-gray-50/50">
                            <tr>
                                {TABLE_HEAD.map((head) => (
                                    <th
                                        key={head}
                                        className="border border-gray-300 p-4 cursor-pointer relative"
                                        onClick={head.toLowerCase() === 'action' ? undefined : () => requestSort(head.toLowerCase().replace(' ', '_'))}
                                    >
                                        <div className="flex items-center">
                                            <Typography
                                                variant="small"
                                                color="blue-gray"
                                                className="font-semibold leading-none opacity-70 font-poppins text-left text-xs"
                                            >
                                                {head}
                                            </Typography>
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
                            ) : sortedRows.length > 0 ? (
                                currentPageData.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
                                        <td className="border border-gray-300 p-2">
                                            <div className="flex items-center">
                                                <IconButton variant="text" color="blue" onClick={() => handleEdit(row.id)}>
                                                    <PencilIcon className="h-5 w-5" />
                                                </IconButton>
                                                <IconButton variant="text" color="red" onClick={() => handleDelete(row.id)}>
                                                    <TrashIcon className="h-5 w-5" />
                                                </IconButton>
                                                {!row.is_create_forecast &&
                                                    <IconButton variant="text" color="red" onClick={() => handleOrder(row.id)}>
                                                        <HandCoinsIcon className="h-5 w-5" />
                                                    </IconButton>
                                                }
                                            </div>
                                        </td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.sales_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.source_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.company_si)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.customer_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.customer_type_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.product_category_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.po_type_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.status_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.project_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.project_category_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.po_number)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(formatIDR(row.project_nominal))}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.discount)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(formatIDR(row.total_price))}</td>
                                        <td className="border border-gray-300 p-2">
                                            {(() => {
                                                const startDate = formatDate(row.start_periode, false, true, false, true);
                                                const endDate = formatDate(row.end_periode, false, true, false, true);

                                                return [startDate, endDate]
                                                    .filter(Boolean)
                                                    .map(date => highlightText(date))
                                                    .join(' - ');
                                            })()}
                                        </td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.created_by_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.created_time, true, true))}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(row.updated_by_name)}</td>
                                        <td className="border border-gray-300 p-2">{highlightText(formatDate(row.updated_time, true, true))}</td>
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

            <Dialog
                open={isOpen}
                handler={() => { }}
                dismiss={{
                    outsidePointerDown: false,
                    escapeKeyDown: false,
                }}
                size="lg"
            >
                <DialogHeader className="font-poppins text-xl font-semibold">{isEditing ? "Edit Data" : "Add Data"}</DialogHeader>
                <DialogBody divider className="p-0">
                    <div className="max-h-[75vh] overflow-y-auto">
                        {/* Form Fields Section */}
                        <div className="px-6 py-4 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-poppins">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <Input
                                        label="PO Number"
                                        name="po_number"
                                        value={formData.po_number}
                                        onChange={handleChange}
                                    />

                                    <Input
                                        label="Project Name"
                                        name="project_name"
                                        value={formData.project_name}
                                        onChange={handleChange}
                                    />

                                    <MaterialSelect
                                        label="PO Type"
                                        name="po_type"
                                        value={formData.po_type}
                                        onChange={(value) => setFormData({ ...formData, po_type: String(value) })}
                                    >
                                        {param.poType?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                    <MaterialSelect
                                        label="Product Category"
                                        name="product_category"
                                        value={formData.product_category}
                                        menuProps={{
                                            className: "max-h-[20vh] overflow-y-scroll"
                                        }}
                                        onChange={(value) => setFormData({ ...formData, product_category: String(value) })}
                                    >
                                        {param.productCategory?.map((parameter, idx) => (
                                            <Option key={idx} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                    <MaterialSelect
                                        label="Project Category"
                                        name="project_category"
                                        value={formData.project_category}
                                        onChange={(value) => setFormData({ ...formData, project_category: String(value) })}
                                    >
                                        {param.projectCategory?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                    <MaterialSelect
                                        label="Source"
                                        name="source"
                                        value={formData.source}
                                        onChange={(value) => setFormData({ ...formData, source: String(value) })}
                                    >
                                        {param.source?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>


                                    <Select
                                        options={customerOptions}
                                        value={customerOptions.find(option => option.value === formData.customer) || null}
                                        isSearchable={true}
                                        onChange={(selectedOption) => {
                                            if (selectedOption) {
                                                setFormData({ ...formData, customer: selectedOption.value });
                                            }
                                        }}
                                        placeholder="Customer"
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
                                            }),
                                        }}
                                    />



                                    <MaterialSelect
                                        label="Company SI"
                                        name="company_si"
                                        value={formData.company_si}
                                        onChange={(value) => setFormData({ ...formData, company_si: String(value) })}
                                    >
                                        {param.companySi?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">

                                    <DateTimeRangePicker
                                        showTime={false}
                                        value={{
                                            startDate: formData.start_periode,
                                            endDate: formData.end_periode
                                        }}
                                        onChange={(value) => setFormData(prev => ({
                                            ...prev,
                                            start_periode: value.startDate,
                                            end_periode: value.endDate
                                        }))}
                                        labelTitle={'Periode'}
                                    />
                                    <MaterialSelect
                                        label="Status"
                                        name="status"
                                        value={formData.status}
                                        onChange={(value) => setFormData({ ...formData, status: String(value) })}
                                    >
                                        {param.forecastStatus?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                    <MaterialSelect
                                        label="Customer Type"
                                        name="customer_type"
                                        value={formData.customer_type}
                                        onChange={(value) => setFormData({ ...formData, customer_type: String(value) })}
                                    >
                                        {param.customerType?.map(parameter => (
                                            <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                {parameter.description}
                                            </Option>
                                        ))}
                                    </MaterialSelect>

                                    <Select
                                        options={salesNameOpt}
                                        value={salesNameOpt.find(option => option.value === formData.sales_name) || null}
                                        isSearchable={true}
                                        onChange={(selectedOption) => {
                                            if (selectedOption) {
                                                setFormData({ ...formData, sales_name: selectedOption.value });
                                            }
                                        }}
                                        placeholder="Sales Name"
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
                                            }),
                                        }}
                                    />

                                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                                        <h4 className="text-xs font-semibold text-blue-800 mb-3">Payment Calculation</h4>

                                        <div className="mb-3">
                                            <Input
                                                label="Project Nominal"
                                                name="project_nominal"
                                                type="text"
                                                inputMode="decimal"
                                                value={formatIDR(formData.project_nominal)}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <Input
                                                label="Discount (%)"
                                                name="discount"
                                                type="text"
                                                inputMode="decimal"
                                                value={formData.discount}
                                                onChange={handleChange}
                                            />
                                            <p className="text-xs text-blue-600 mt-1">Support decimal (e.g., 12.5%). Maximum: 100%</p>
                                        </div>

                                        <div>
                                            {/* <label className="text-xs font-medium text-gray-700 block mb-1">Total Price</label> */}
                                            <Input
                                                label="Total Price"
                                                name="total_price"
                                                type="text"
                                                readOnly  // Kembalikan readOnly karena ini auto-calculated
                                                inputMode="numeric"
                                                value={formatIDR(formData.total_price || 0)}  // ← Pakai formData.total_price
                                                className="bg-gray-100"  // Optional: beri visual bahwa ini read-only
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Checkpoint Section */}
                        <div className="px-6 py-4 bg-white border-t-2 border-gray-200">
                            <ForecastCheckpoint
                                setFormData={setFormData}
                                formData={formData}
                                paramStatus={param.statusPayment}
                            />
                        </div>
                    </div>
                </DialogBody>

                <DialogFooter className="h-[9vh] mt-2 flex justify-end items-center gap-2">
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => { { setIsOpen(false) } setFilesEvent([]) }}
                        size="md"
                        className="h-10 w-16 mt-[-20px] flex justify-center items-center"
                    >
                        <span className="font-poppins font-semibold">Cancel</span>
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleSubmit}
                        size="md"
                        className="h-10 w-16 mt-[-20px] flex justify-center items-center"
                    >
                        <span className="font-poppins font-semibold">{isEditing ? "Save" : "Add"}</span>
                    </Button>
                </DialogFooter>
            </Dialog>

            <NotificationDialog
                open={confirmDelete}
                setOpen={(isOpen) => setConfirmDelete(isOpen)}
                message="Are you sure you want to delete this data?"
                isConfirmation={true}
                onConfirm={confirmDeletion}
                onCancel={() => setConfirmDelete(false)}
            />

            <NotificationDialog
                open={notification.open}
                setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
                message={notification.message}
                isError={notification.isError}
                isWarning={notification.isWarning}
            />
            <CreateOrder isOpen={isOrder} onClose={() => setIsOrder(false)} setIsOpen={setIsOrder} fetchForecastPrincipal={fetchForecastPrincipal} />
        </>
    );
}
