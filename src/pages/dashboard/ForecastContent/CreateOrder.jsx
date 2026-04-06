import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, Select as MaterialSelect } from "@material-tailwind/react";
import Select from 'react-select';
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import Multiselect from "multiselect-react-dropdown";
import ForecastCheckpoint from '@/components/ForecastCheckpoint';
import { useForecast } from '@/zustand';
import { apiRequest, processAndSetData } from '@/utils/api-helper';
import NotificationDialog from '@/components/NotificationDialog';
import Cookies from 'js-cookie';
import { decryptPayload, encryptPayload } from '@/services/codec/codec';
import { capitalizeWords } from '@/utils/helper';



const getDescriptionFromId = (
    id,
    dropdownData,
    {
        idKey = "data",
        labelKey = "description",
        defaultValue = ""
    } = {}
) => {
    if (!id || !Array.isArray(dropdownData)) return defaultValue;

    const found = dropdownData.find(
        (item) => item[idKey] === id
    );

    return found ? found[labelKey] : defaultValue;
};

const arrayToString = (arr) => {
    let str = '';
    arr.forEach((item, index) => {
        str += item.id;
        if (index < arr.length - 1) {
            str += ',';
        }
    });
    console.log(`ARRAY TO STRINGG ${str}`)
    return str;
};


const CreateOrder = ({
    isOpen = false,
    onClose = () => { },
    isEditing = false,
    initialData = {},
    onSubmit = () => { },
    getRootProps,
    getInputProps,
    externalFiles,
    onFilesChange,
    param = [],
    customerOptions = [],
    user = [],
    initialSelectedUsers = [],
    customStyles = {},
    labels,
    fetchForecastPrincipal
}) => {
    const defaultFormData = {
        // Data dari Forecast Principal (Read-only)
        id: "",
        po_number: "",
        customer_id: "",
        sales_name: "",
        project_nominal: "",
        discount: "",
        total_price: "",
        checkpoint: [],
        project_name: "",
        po_type: "",
        product_category: "",
        project_category: "",
        source: "",
        company_si: "",
        customer_type: "",
        status: "",
        start_periode: "",
        end_periode: "",

        // Data untuk Create Order (Editable)
        po_date: "",
        fase: "",
        project_type: "",
        live_date: "",
        po_description: "",
        duration: "",
        attachment: ""
    };

    const defaultLabels = {
        dialogTitle: isEditing ? "Edit Order" : "Create Order",
        // Forecast Principal Section
        forecastSection: "Forecast Principal Data",
        poNumber: "PO Number",
        customer: "Customer",
        salesName: "Sales Name",
        projectNominal: "Project Nominal",
        discount: "Discount (%)",
        totalPrice: "Total Price",
        projectName: "Project Name (Forecast)",
        poType: "PO Type",
        productCategory: "Product Category",
        projectCategory: "Project Category",
        source: "Source",
        companySi: "Company SI",
        customerType: "Customer Type",
        status: "Status",
        periode: "Periode",

        // Create Order Section
        orderSection: "Order Details",
        poDate: "PO Date",
        numberOfPhases: "Number of Phases",
        attachment: "Attachment",
        projectType: "Project Type",
        targetLive: "Target Live",
        poName: "PO Name",
        poDescription: "PO Description",
        duration: "Duration",

        // Actions
        cancel: "Cancel",
        submit: isEditing ? "Save" : "Add"
    };

    const mergedLabels = { ...defaultLabels, ...labels };


    const { orderData, setOrderData, paramValues } = useForecast();

    const [formData, setFormData] = useState({ ...defaultFormData });
    const [filesEvent, setFilesEvent] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);
    const [projectType, setProjectType] = useState([]);
    const [userData, setUserData] = useState([])
    const [notification, setNotification] = useState({ open: false, message: '', isError: false });

    const fetchParameterProjectType = async () => {
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/parameters/project-type`);
            processAndSetData(responseData, setProjectType);
        } catch (error) {
            console.error("Error fetching parameters:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/users`);
            if (responseData && Array.isArray(responseData.data)) {
                const newUserMap = {};
                responseData.data.forEach(user => {
                    newUserMap[user.id] = user.name;
                });
                setUserData(responseData.data);
            } else {
                console.error("Received users data is not an array or missing 'data' property: ", responseData);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchParameterProjectType();
        fetchUsers()
    }, []);


    useEffect(() => {
        if (isOpen && orderData && Object.keys(orderData).length > 0) {
            setFormData(prev => ({
                ...prev,
                // Data dari Forecast Principal
                id: orderData.id || '',
                po_number: orderData.po_number || '',
                customer_id: orderData.customer || '',
                sales_name: orderData.sales_name || '',
                project_nominal: orderData.project_nominal || '',
                discount: orderData.discount || '',
                total_price: orderData.total_price || '',
                checkpoint: Array.isArray(orderData.checkpoint) ? orderData.checkpoint : [],
                project_name: orderData.project_name || '',
                po_type: orderData.po_type || '',
                product_category: orderData.product_category || '',
                project_category: orderData.project_category || '',
                source: orderData.source || '',
                company_si: orderData.company_si || '',
                customer_type: orderData.customer_type || '',
                status: orderData.status || '',
                start_periode: orderData.start_periode || '',
                end_periode: orderData.end_periode || ''
            }));
        }
    }, [isOpen, orderData]);


    useEffect(() => {
        if (isEditing && initialData) {
            setFormData({ ...defaultFormData, ...initialData });
        }
    }, [initialData, isEditing]);

    useEffect(() => {
        if (initialSelectedUsers && initialSelectedUsers.length > 0) {
            setSelectedUsers(initialSelectedUsers);
        }
    }, [initialSelectedUsers]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const uploadFilePurchaseOrder = async (filesEvent, formData, token, isEditing, shouldResetFiles = true) => {

        const uploadFormData = new FormData();

        if (isEditing && formData.attachment) {
            uploadFormData.append('oldFile', formData.attachment);
        }

        const file = filesEvent[0];
        if (file) {
            uploadFormData.append('objectFiles', file);
        } else {
            console.log('masuk sini')
            throw new Error('No file selected for upload');
        }

        const url = isEditing
            ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
            : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`;

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            method: "POST",
            body: uploadFormData,
        });

        if (!response.ok) throw new Error('File upload failed');

        const uploadData = await response.json();
        const decryptedUploadData = decryptPayload(uploadData.msg);
        const uploadObjectData = JSON.parse(decryptedUploadData);

        if (uploadObjectData.status !== 'success' || !uploadObjectData.data || !uploadObjectData.data.filename) {
            throw new Error('File upload failed: Missing filename in response');
        }

        // Ini akan dipanggil true hanya saat submit berhasil (dari handleClose)
        if (shouldResetFiles) {
            setFilesEvent([]);
        }

        return uploadObjectData.data.filename;
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const token = Cookies.get('TOKEN');
        const rawUserId = Cookies.get('USER_ID');
        const decryptedUserId = decryptPayload(rawUserId);
        console.log('decrypt', decryptedUserId)
        let fileName = formData.attachment || "";
        const isFileChanged = filesEvent.length > 0 && (
            !formData.attachment ||
            !filesEvent.every(file => formData.attachment.includes(file.name))
        );

        if (isFileChanged) {
            fileName = await uploadFilePurchaseOrder(filesEvent, formData, token, isEditing, false);
        }

        if (!/^\d+$/.test(formData.fase)) {
            setNotification({
                open: true,
                message: 'Nilai fase harus bilangan bulat dan minimal 0',
                isError: true,
            });
            return;
        }

        const prepareCheckpointForSubmission = (checkpoints) => {
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

        let dataToSend = {
            ...formData,
            forecast_id: formData.id,
            attachment: fileName,
            duration: parseInt(formData.duration, 10),
            project_type: String(formData.project_type),
            created_by: decryptedUserId,
            updated_by: isEditing ? decryptedUserId : undefined,
            fase: parseInt(formData.fase),
            checkpoint: formData.checkpoint ? prepareCheckpointForSubmission(formData.checkpoint) : '[]',
            is_forecast: true
        };

        delete dataToSend.id

        const method = isEditing ? "PUT" : "POST";
        const base64_poNumber = btoa(formData?.po_number)
        const endpoint = isEditing
            ? `/api/v1/purchase-order/${base64_poNumber}/edit`
            : "/api/v1/purchase-order/store";

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
            setNotification({ 
                open: true, 
                message: message || 'An Error Occurred While Saving The Data.', 
                isError: true 
            });
        } else if (statusCode >= 400 && statusCode < 500) {
            setNotification({ 
                open: true, 
                message: message || 'A Warning Occurred.', 
                isError: false, 
                isWarning: true 
            });
        } else if (statusCode === 200) {
            setNotification({ open: true, message, isError: false });
            handleClose();
            await fetchForecastPrincipal();
        } else {
            setNotification({ 
                open: true, 
                message: message || 'An Error Occurred While Saving The Data.', 
                isError: true 
            });
        }
    } catch (error) {
        console.error("Error saving data: ", error);
        setNotification({ 
            open: true, 
            message: 'An Unexpected Error Occurred. Please Try Again Later.', 
            isError: true 
        });
    }
};

    const handleClose = () => {
        setFormData(defaultFormData);
        setFilesEvent([]);
        setSelectedUsers([]);
        setOrderData({});
        onClose();
    };

    const useExternalFileHandlers = getRootProps && getInputProps && externalFiles !== undefined;

    const internalGetRootProps = (props = {}) => ({
        ...props,
        onClick: () => document.getElementById('file-input')?.click()
    });

    const internalGetInputProps = () => ({
        id: 'file-input',
        type: 'file',
        multiple: true,
        onChange: (e) => {
            const newFiles = Array.from(e.target.files || []);
            setFilesEvent(prev => [...prev, ...newFiles]);
        },
        style: { display: 'none' }
    });

    const removeFile = (fileName) => {
        setFilesEvent(prev => prev.filter(file => file.name !== fileName));
    };

    const onSelectUsername = (selectedList, selectedItem) => {
        formData.notification_receivers = arrayToString(selectedList);
    };

    const onRemoveUsername = (selectedList, removedItem) => {
        formData.notification_receivers = arrayToString(selectedList);
    };



    const finalGetRootProps = useExternalFileHandlers ? getRootProps : internalGetRootProps;
    const finalGetInputProps = useExternalFileHandlers ? getInputProps : internalGetInputProps;
    const finalFilesEvent = useExternalFileHandlers ? (externalFiles || []) : filesEvent;

    // Format IDR
    const formatIDR = (number) => {
        const numValue = typeof number === 'string' ? parseFloat(number) : number;
        return new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(numValue || 0);
    };

    const customerOptionsFromParam = useMemo(() => {
        const customerData = paramValues?.customer_data || [];
        return customerData.map(c => ({
            value: c.id,
            label: `${c.name} - ${c.id}`,
        }));
    }, [paramValues?.customer_data]);

    const salesNameOptions = useMemo(() => {
        const salesData = paramValues?.sales_name_data || [];
        return salesData.map(item => ({
            value: item.id,
            label: item.name,
        }));
    }, [paramValues?.sales_name_data]);

    const statusPaymentOptions = useMemo(() => {
        return paramValues?.status_payment_data || [];
    }, [paramValues?.status_payment_data]);

    const formatDate = (dateString, showTime = false) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            ...(showTime && { hour: '2-digit', minute: '2-digit' })
        };
        return date.toLocaleDateString('id-ID', options);
    };

    const formatPeriode = () => {
        const start = formatDate(formData.start_periode);
        const end = formatDate(formData.end_periode);
        if (!start && !end) return '';
        return `${start} → ${end}`;
    };

    return (
        <>
            <Dialog
                open={isOpen}
                handler={() => { }}
                dismiss={{
                    outsidePointerDown: false,
                    escapeKeyDown: false,
                }}
                size="xl"
            >
                <DialogHeader className="font-poppins text-xl font-semibold">
                    {mergedLabels.dialogTitle}
                </DialogHeader>
                <DialogBody divider className="overflow-auto max-h-[75vh]">
                    <div className="font-poppins space-y-6">
                        {/* SECTION 1: Forecast Principal Data (Read-Only) */}
                        <div className="p-6 rounded-lg border-2 border-blue-200">
                            <h3 className="text-base font-semibold text-blue-900 mb-4 flex items-center">
                                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
                                {mergedLabels.forecastSection}
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <Input
                                        label={mergedLabels.poNumber}
                                        name="po_number"
                                        value={formData.po_number}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Select
                                        options={customerOptionsFromParam}
                                        value={customerOptionsFromParam.find(option => option.value === formData.customer_id) || null}
                                        isDisabled={true}
                                        placeholder={mergedLabels.customer}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: '7px',
                                                padding: '2px',
                                                fontSize: '14px',
                                            }),
                                        }}
                                    />

                                    <Input
                                        label={mergedLabels.customerType}
                                        name="customer_type"
                                        value={getDescriptionFromId(formData.customer_type, paramValues.customer_type_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Select
                                        options={salesNameOptions}
                                        value={salesNameOptions.find(option => option.value === formData.sales_name) || null}
                                        isDisabled={true}
                                        placeholder={mergedLabels.salesName}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                backgroundColor: '#f3f4f6',
                                                borderRadius: '7px',
                                                padding: '2px',
                                                fontSize: '14px',
                                            }),
                                        }}
                                    />

                                    <Input
                                        label={mergedLabels.source}
                                        name="source"
                                        value={getDescriptionFromId(formData.source, paramValues.source_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.companySi}
                                        name="company_si"
                                        value={getDescriptionFromId(formData.company_si, paramValues.company_si_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <Input
                                        label={mergedLabels.projectName}
                                        name="project_name"
                                        value={formData.project_name}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.projectCategory}
                                        name="project_category"
                                        value={getDescriptionFromId(formData.project_category, paramValues.project_category_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.poType}
                                        name="po_type"
                                        value={getDescriptionFromId(formData.po_type, paramValues.po_type_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.productCategory}
                                        name="product_category"
                                        value={getDescriptionFromId(formData.product_category, paramValues.product_category_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.status}
                                        name="status"
                                        value={getDescriptionFromId(formData.status, paramValues.forecast_status_data)}
                                        readOnly
                                        className="bg-gray-100"
                                    />

                                    <Input
                                        label={mergedLabels.periode}
                                        name="periode"
                                        value={formatPeriode()}
                                        readOnly
                                        className="bg-gray-100"
                                    />
                                </div>

                                {/* Column 3 - Financial Info */}
                                <div className="space-y-4">
                                    <div className="bg-white flex flex-col gap-5 p-4 rounded-lg border border-blue-300">
                                        <h4 className="text-xs font-semibold text-blue-800 mb-3">Financial Information</h4>

                                        <Input
                                            label={mergedLabels.projectNominal}
                                            name="project_nominal"
                                            value={formatIDR(formData.project_nominal)}
                                            readOnly
                                            className="bg-gray-100 mb-3"
                                        />

                                        <Input
                                            label={mergedLabels.discount}
                                            name="discount"
                                            value={formData.discount}
                                            readOnly
                                            className="bg-gray-100 mb-3"
                                        />

                                        <Input
                                            label={mergedLabels.totalPrice}
                                            name="total_price"
                                            value={formatIDR(formData.total_price)}
                                            readOnly
                                            className="bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: Order Details (Editable) */}
                        <div className="p-6 flex flex-col gap-5 rounded-lg border-2 border-green-200">
                            <h3 className="text-base font-semibold text-green-900 mb-4 flex items-center">
                                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                                {mergedLabels.orderSection}
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    <Input
                                        label={mergedLabels.poDate}
                                        name="po_date"
                                        type="date"
                                        value={formData.po_date}
                                        onChange={handleChange}
                                    />

                                    <Input
                                        label={mergedLabels.numberOfPhases}
                                        name="fase"
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={formData.fase}
                                        onChange={handleChange}
                                    />

                                    <div className="w-full">
                                        <label className="block text-xs font-normal mb-2">{mergedLabels.attachment}</label>
                                        <div
                                            {...finalGetRootProps({
                                                className:
                                                    "dropzone border border-blue-gray-200 rounded-lg p-4 flex flex-col items-center cursor-pointer h-30 bg-white",
                                            })}
                                        >
                                            <input {...finalGetInputProps()} />
                                            <div className="text-blue-gray-300 text-lg mb-2">
                                                <ArrowUpTrayIcon className="h-6 w-6" />
                                            </div>
                                            <p className="text-blue-gray-300 text-xs font-normal font-poppins">
                                                Drag & Drop or Click to Select Files
                                            </p>
                                        </div>

                                        {finalFilesEvent && finalFilesEvent.length > 0 && (
                                            <div className="mt-4">
                                                <div className="flex flex-col gap-2">
                                                    {finalFilesEvent.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center bg-gray-100 rounded-md p-3"
                                                        >
                                                            <span className="truncate text-gray-700 text-xs font-poppins">
                                                                {file.name}
                                                            </span>
                                                            <button
                                                                onClick={() => removeFile(file.name)}
                                                                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <MaterialSelect
                                        label={mergedLabels.projectType}
                                        name="project_type"
                                        value={formData.project_type}
                                        onChange={(value) => setFormData(prev => ({ ...prev, project_type: String(value) }))}
                                    >
                                        {projectType && projectType.length > 0 ? (
                                            projectType.map(parameter => (
                                                <Option key={parameter.data} value={parameter.data} className="font-poppins">
                                                    {parameter.description}
                                                </Option>
                                            ))
                                        ) : (
                                            <Option value="" disabled className="font-poppins">
                                                No options available
                                            </Option>
                                        )}
                                    </MaterialSelect>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <Input
                                        label={mergedLabels.targetLive}
                                        name="live_date"
                                        type="date"
                                        value={formData.live_date}
                                        onChange={handleChange}
                                    />

                                    <Input
                                        label={mergedLabels.poName}
                                        name="project_name"
                                        value={formData.project_name}
                                        onChange={handleChange}
                                        placeholder="Enter PO name for order"
                                    />

                                    <Textarea
                                        label={mergedLabels.poDescription}
                                        name="po_description"
                                        value={formData.po_description}
                                        onChange={handleChange}
                                        rows={4}
                                    />

                                    <Input
                                        label={mergedLabels.duration}
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        icon={<span className="-ml-3 text-[12px]">Days</span>}
                                    />
                                </div>
                            </div>
                            <div className='flex flex-col gap-1 w-full font-medium'>
                                <p className='text-xs '>Send Notification</p>
                                <Multiselect
                                    options={userData.map(e => e)}
                                    selectedValues={null}
                                    onSelect={onSelectUsername}
                                    onRemove={onRemoveUsername}
                                    displayValue="name"
                                    placeholder="Username"
                                    style={customStyles}
                                    className="text-sm ml-2"
                                />
                            </div>
                        </div>

                        {/* SECTION 3: Checkpoint (Full Width, Read-Only) */}
                        <div className="p-6 rounded-lg border-2 border-purple-200">
                            <h3 className="text-base font-semibold text-purple-900 mb-4 flex items-center">
                                <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">3</span>
                                Payment Checkpoint
                            </h3>

                            <ForecastCheckpoint
                                formData={formData}
                                setFormData={setFormData}
                                paramStatus={statusPaymentOptions}
                                readOnly={true}
                            />
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter className="h-[9vh] mt-2 flex justify-end items-center gap-2">
                    <Button
                        variant="text"
                        color="red"
                        onClick={handleClose}
                        size="md"
                        className="h-10 w-20 mt-[-20px] flex justify-center items-center"
                    >
                        <span className="font-poppins font-semibold">{mergedLabels.cancel}</span>
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={handleSubmit}
                        size="md"
                        className="h-10 w-20 mt-[-20px] flex justify-center items-center"
                    >
                        <span className="font-poppins font-semibold">{mergedLabels.submit}</span>
                    </Button>
                </DialogFooter>
            </Dialog>

            <NotificationDialog
                open={notification.open}
                setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
                message={notification.message}
                isError={notification.isError}
                isWarning={notification.isWarning} />
        </>
    );
};

export default CreateOrder;