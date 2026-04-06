import React, { useEffect, useState, useMemo } from "react";
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Dialog, DialogHeader, DialogBody, DialogFooter, Select as MaterialSelect, Option, Spinner } from "@material-tailwind/react";
import { ArrowUpTrayIcon, InformationCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { decryptPayload, encryptPayload } from "@/services/codec/codec";
import { CKEditor } from '@ckeditor/ckeditor5-react';
import TaskDetailCard from "@/components/TaskDetailCard";
import SubTaskCard from "../../components/SubTaskCard";
import NotificationDialog from "@/components/NotificationDialog";
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { useDropzone } from 'react-dropzone';
import { formatDate, capitalizeWords } from "@/utils/helper";
import Cookies from 'js-cookie';
import { apiRequest, processAndSetData } from "@/utils/api-helper";
import Select from 'react-select';
import Multiselect from "multiselect-react-dropdown";
import { useTasklist } from "@/zustand";
import ModalDelete from "./TasklistContent/ModalDelelte";
import AssigneeSelector from "@/components/AssigneeSelector";

const TABLE_HEAD = ["Actions", "Detail", "Kode", "Title", "Task Severity", "Start Date", "Due Date", "Mandays", "Task Status", "Project Manager", "Business Analyst", "Quality Control", "Sales", "Infra", "Sub PI", "Assignee", "Created By", "Updated By"];

export function TaskList() {
  const [loading, setLoading] = useState({
    submitTask : false,
    submitSubtask : false
  });
  const [TABLE_ROWS, setTABLE_ROWS] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: '', isError: false });
  const [sortConfig, setSortConfig] = useState({ key: 'kode', direction: 'ascending' });
  const [projectAssignment, setProjectAssignment] = useState([]);
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [projectSelected, setProjectSelected] = useState(false);
  const [projectKey, setProjectKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [subtasklist, setSubtasklist] = useState([]);
  const [isEditingSub, setIsEditingSub] = useState(false);
  const [isOpenSub, setIsOpenSub] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({ kode: "", title: "", description: "", attachment: "", duedate: "", startdate: "", status_id: "", project_id: "", assignee: "", business_analyst: "", project_manager: "", task_severity: "", quality_control: "", sales: "", infra: "", sub_pi: "", mandays: "" });
  const [formDataSub, setFormDataSub] = useState({ kode: "", tasklist_id: "", title: "", description: "", attachment: "", assignee: "", status_id: "", startdate: "", duedate: "", mandays: "" });
  const [filesEvent, setFilesEvent] = useState([]);
  const [dropDownProjectStatus, setDropDownProjectStatus] = useState([])
  const [user, setUser] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState({ quality_control: [], infra: [], sales: [], sub_pi: [] })
  const [userMap, setUserMap] = useState({});
  const {setOpenModalDelete,setDataDelete} = useTasklist()
  const [editedFile,setEditedFile] = useState([])
  const [editedFileSub,setEditedFileSub] = useState([])
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('');
   const [divisionData,setDivisionData] = useState([])


  const PER_PAGE = 10;
  const offset = currentPage * PER_PAGE;
  const rawUserId = Cookies.get('USER_ID');
  const decryptedUserId = decryptPayload(rawUserId);
  const [userNotification, setUserNotification] = useState([]);


  const customStyles = {
    multiselectContainer: { border: '1px solid rgba(30, 41, 59, 0.3)', borderRadius: '7px', padding: '2px', paddingLeft: '5px' },
    dropdownContainer: { border: '1px solid rgba(30, 41, 59, 0.3)', borderRadius: '7px' },
    searchBox: { border: 'none', borderRadius: '7px', padding: '5px' },
    optionContainer: { backgroundColor: '#fff', borderRadius: '7px' },
    option: { padding: '10px' },
    selectedOption: { backgroundColor: '#e0e0e0' },
  };

  useEffect(() => {
    fetchProjectAssignment();
    fetchInitial()
    fetchUsers()
    fetchProjectUserAssigned();
    fetchDivision()
  }, []);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectTask();
    }
  }, [formData.project_id,formData.status_id]);

  useEffect(() => {
    if (formData.project_id) {
      fetchProjectUserAssigned();
    }
  }, [formData.project_id]);


     const fetchDivision = async () => {
        setIsLoading(true);
        try {
          const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/groups/division`);
          processAndSetData(responseData, setDivisionData);
        } catch (error) {
          console.error("Error fetching groups division: ", error);
        } finally {
          setIsLoading(false);
        }
      };

  const fetchProjectUserAssigned = async () => {
    setIsLoading(true);
    const url = `${import.meta.env.VITE_BASE_URL}/api/v1/project-assignee/${formData.project_id}/assignees`;
    const data = await apiRequest(url);
    setIsLoading(false);
    processAndSetData(data?.data, setUserNotification);
  };

  const fetchUsers = async () => {
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/users`);
      if (responseData && Array.isArray(responseData.data)) {
        const newUserMap = {};
        responseData.data.forEach(user => {
          newUserMap[user.id] = user.name;
        });
        setUserMap(newUserMap);
        setUser(responseData.data);
      } else {
        console.error("Received users data is not an array or missing 'data' property: ", responseData);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProjectAssignment = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/project-status`);
      processAndSetData(responseData, setProjectAssignment);
    } catch (error) {
      console.error("Error fetching project assignment:", error);
    }
    setIsLoading(false);
  };

  const fetchInitial = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ user_id: decryptedUserId });
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/task-list?${query.toString()}`);

      if (responseData && Array.isArray(responseData.data)) {
        setTABLE_ROWS(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setTABLE_ROWS([]);
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectTask = async () => {
    setIsLoading(true);
    try {
      const url = `${import.meta.env.VITE_BASE_URL}/api/v1/task-list/${formData.project_id}/by-project`;
      const responseData = await apiRequest(url);
      // console.log('responsedata', responseData)
      if (responseData && Array.isArray(responseData.data)) {
        setTABLE_ROWS(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setTABLE_ROWS([]);
      }
    } catch (error) {
      console.error("Error fetching project to task data:", error);
      setTABLE_ROWS([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectSubTask = async (kode) => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/substasklist/${kode}/get-all`);

      if (responseData && Array.isArray(responseData.data)) {
        setSubtasklist(responseData.data.length === 0 ? [] : responseData.data);
      } else {
        console.error("Received data is not an array or missing 'data' property: ", responseData);
        setSubtasklist([]);
      }
    } catch (error) {
      console.error("Error fetching subtask list data:", error);
      setSubtasklist([]);
    } finally {
      setIsLoading(false);
    }
  };

  const arrayToString = (arr) => {
    let str = '';
    arr.forEach((item, index) => {
      str += item.name;
      if (index < arr.length - 1) {
        str += ',';
      }
    });
    console.log(`ARRAY TO STRINGG ${str}`)
    return str;
  };

  const roles = [
    { key: "quality_control", label: "Quality Control" },
    { key: "sales", label: "Sales" },
    { key: "infra", label: "Infra" },
    { key: "sub_pi", label: "Sub PI" },
  ];

  const handleSelect = (key, selectedList) => {
    formData[key] = arrayToString(selectedList);
  };

  const handleRemove = (key, selectedList) => {
    formData[key] = arrayToString(selectedList);
  };

  const getSelectedUsername = (roles) => {
    if (!user || !user.length) return;

    let selectedUsers = {};

    Object.keys(roles).forEach((role) => {
      if (roles[role]) {
        const selectedUserIds = roles[role].toString().split(',');
        selectedUsers[role] = user
          .filter((usr) => selectedUserIds.includes(usr.name))
          .sort((a, b) => selectedUserIds.indexOf(a.name) - selectedUserIds.indexOf(b.name));
      } else {
        selectedUsers[role] = [];
      }
    });

    setSelectedQuality((prevState) => ({
      ...prevState,
      ...selectedUsers,
    }));
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
        const formattedDueDate = row.duedate ? formatDate(row.duedate).toLowerCase() : '';
        const formattedStartDate = row.startdate ? formatDate(row.startdate).toLowerCase() : '';

        const fieldsToSearch = [
          'kode', 'title', 'description', 'task_severity',
          'duedate', 'startdate', 'assignee', 'created_by_name',
          'updated_by_name', 'business_analyst', 'quality_control',
          'sales', 'sub_pi', 'infra', 'status_id', 'mandays'
        ];

        return fieldsToSearch.some(key => {
          const value = row[key];
          if (key === 'duedate') return formattedDueDate.includes(query);
          if (key === 'startdate') return formattedStartDate.includes(query);
          return value && value.toString().toLowerCase().includes(query);
        });
      });
    };
  

    const sortedRows = useMemo(() => {

      let filteredByStatus = [...TABLE_ROWS];
      console.log('filteredFIlter',selectedStatusFilter)
      console.log('before selected',filteredByStatus)
      if (selectedStatusFilter) {
        filteredByStatus = TABLE_ROWS.filter(row => row.status_id === selectedStatusFilter);
      }
      
    
      if (!sortConfig) return filteredByStatus;

      const { key, direction } = sortConfig;
      
      const fieldMapping = {
        task_status: 'status_id',
        start_date: 'startdate',
        end_date: 'duedate',
      };

      return filteredByStatus.sort((a, b) => {
        const actualKey = fieldMapping[key] || key; 
        const aValue = a[actualKey];
        const bValue = b[actualKey];

        if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }, [TABLE_ROWS, sortConfig, selectedStatusFilter]);
  

      // useMemo(() => {
      //   return filterRows(sortedRows);
      // }, [sortedRows, searchQuery]);
  

  const requestSort = (key) => {
    if (key === 'actions') return;
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig?.key === key && prevConfig?.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const filteredRows = filterRows(sortedRows);
  const currentPageData = filteredRows.slice(offset, offset + PER_PAGE);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleChangeSub = (e) => {
    setFormDataSub({
      ...formDataSub,
      [e.target.name]: e.target.value,
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFilesEvent((prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const removeFile = (fileNameToRemove) => {
    setFilesEvent((prevFiles) => {
      const removedFile = prevFiles.find(file => file.name === fileNameToRemove);
      const updatedFiles = prevFiles.filter(file => file.name !== fileNameToRemove);
  
      if (removedFile) {
        setEditedFile((prevEdited) => [...prevEdited, removedFile]); // append ke list
      }
  
      return updatedFiles;
    });
  };

  const removeFileSub = (fileNameToRemove) => {
    setFilesEvent((prevFiles) => {
      const removedFile = prevFiles.find(file => file.name === fileNameToRemove);
      const updatedFiles = prevFiles.filter(file => file.name !== fileNameToRemove);
  
      if (removedFile) {
        setEditedFileSub((prevEdited) => [...prevEdited, removedFile]); // append ke list
      }
  
      return updatedFiles;
    });
  };
  
  

  const handleFileChange = (event) => {
    const receivedFiles = Array.from(event.target.files);
    setFilesEvent((prevFiles) => {
      const updatedFiles = [...prevFiles, ...receivedFiles];
      setFormData((prevFormData) => ({
        ...prevFormData,
        objectFiles: updatedFiles,
      }));
      return updatedFiles;
    });
  };

  const handleFileChangeSub = (event) => {
    const receivedFiles = Array.from(event.target.files);
    setFilesEvent((prevFiles) => {
      const updatedFiles = [...prevFiles, ...receivedFiles];
      setFormDataSub((prevFormData) => ({
        ...prevFormData,
        objectFiles: updatedFiles,
      }));
      return updatedFiles;
    });
  };

  const handleDetailClick = (task) => {
    setSelectedTask(task);
    setShowDetail(true);
    fetchProjectSubTask(task.kode);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  function handlePageClick(pageNumber) {
    setCurrentPage(pageNumber);
  }

  const uploadFileTask = async (formData, token, isEditing) => {
    const isMultipleFiles = filesEvent.length > 1;
    const uploadFormData = new FormData();
  
    if (isEditing) {
      // Tambahkan semua nama file lama ke dalam FormData
      if (formData.attachment && editedFile.length > 0) {
        editedFile.forEach((item) => {
          uploadFormData.append('oldFile', item.name); // gunakan array jika backend mendukung
        });
      } else {
        uploadFormData.append('oldFile', "");
      }
  
      // Tambahkan file baru
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    } else {
      // Non-edit mode: hanya upload file baru
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    }
  
    const url = isEditing
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
      : (isMultipleFiles
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/upload-multiple/file`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`);
  
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
    const filterAttachments = (attachments, response) => {
      return attachments.filter(item => !response.includes(item));
    };
    
    const attachmentArray = formData.attachment ? formData.attachment.split(',').map(att => att.trim()) : [];

    const responseFilenames = Array.isArray(uploadObjectData.data.filename) 
      ? uploadObjectData.data.filename 
      : [uploadObjectData.data.filename];
    
    let fileNames = [];
    
    if (attachmentArray.length > 0) {
      fileNames = filterAttachments(attachmentArray, uploadObjectData.data.filename);
      for (const file of responseFilenames) {
        if (!attachmentArray.includes(file)) {
          fileNames.push(file);
        }
      }
    } else {
      fileNames = responseFilenames;
    }
    
    setFilesEvent([]);
    setEditedFile([])
    return fileNames.join(',')
  };
  

  const sendFormDataTask = async (formData, fileNames, decryptedUserId, isEditing, token) => {
    const formDataToSend = {
      ...formData,
      attachment: fileNames,
      created_by: decryptedUserId,
      updated_by: isEditing ? decryptedUserId : undefined,
    };
 

    const encryptedDataToSend = encryptPayload(JSON.stringify(formDataToSend));
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing
      ? `/api/v1/task-list/${formData.kode}/edit`
      : "/api/v1/task-list/store";

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: method,
      body: JSON.stringify({ msg: encryptedDataToSend }),
    });

    const data = await response.json();
    const decryptedData = decryptPayload(data.msg);
    return JSON.parse(decryptedData);
  };




  const handleSubmitTask = async () => {
    try {
      setLoading({submitTask : true}); // Set loading true di awal
      const token = Cookies.get('TOKEN');
      const rawUserId = Cookies.get('USER_ID');
      const decryptedUserId = decryptPayload(rawUserId);
  
      let fileName = formData.attachment || "";
  
      // const isFileChanged = filesEvent.length > 0 && (
      //   !formData.attachment || 
      //   !filesEvent.every(file => formData.attachment.includes(file.name))|| 
      //    editedFile.length !== 0
      // );
      // console.log("isFileChanged:", isFileChanged);
  
      if (formData.attachment || filesEvent.length > 0) {
        fileName = await uploadFileTask(formData, token, isEditing);
      }
      // mandatory form validation

      const formDataToSend = {
        ...formData,
        attachment: fileName,
        created_by: decryptedUserId,
        updated_by: isEditing ? decryptedUserId : undefined
      };
      if(!formDataToSend.mandays){
         setNotification({
          open: true,
          message: 'Masukan nilai mandays!',
          isError: true,
        });
        return;
      }
      console.log('form data task to send',formDataToSend)
      if (parseFloat(formData.mandays) < 0.5) {
        setNotification({
          open: true,
          message: 'Nilai mandays minimal 0.5',
          isError: true,
        });
        return;
      }

      const objectData = await sendFormDataTask(formDataToSend, fileName, decryptedUserId, isEditing, token);
  
      if (objectData.status === 'success') {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || `Data ${isEditing ? 'Updated' : 'Added'} Successfully!`,
          isError: false,
        });
        setIsOpen(false);
        setIsEditing(false);
        setFormData(prevFormData => ({
          ...prevFormData,
          kode: "",
          title: "",
          description: "",
          attachment: "",
          duedate: "",
          startdate: "",
          status_id: "",
          assignee: "",
          task_severity: "",
          quality_control: "",
          sales: "",
          infra: "",
          sub_pi: ""
        }));
        fetchProjectTask();
      } else {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
          isError: true,
        });
      }
    } catch (error) {
      console.error("Error handling submit: ", error);
      setNotification({
        open: true,
        message: 'An Unexpected Error Occurred. Please Try Again Later.',
        isError: true,
      });
    } finally {
      setLoading({submitTask:false});
    }
  };
  

  const uploadFileSubTask = async (formDataSub, token, isEditingSub) => {
    const isMultipleFiles = filesEvent.length > 1;
    const uploadFormData = new FormData();
  
    if (isEditingSub) {
      // Tambahkan semua nama file lama ke dalam FormData
      if (formDataSub.attachment && editedFileSub.length > 0) {
        editedFileSub.forEach((item) => {
          uploadFormData.append('oldFile', item.name); // gunakan array jika backend mendukung
        });
      } else {
        uploadFormData.append('oldFile', "");
      }
  
      // Tambahkan file baru
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    } else {
      // Non-edit mode: hanya upload file baru
      filesEvent.forEach((file) => {
        uploadFormData.append('objectFiles', file);
      });
    }
  
    const url = isEditingSub
      ? `${import.meta.env.VITE_BASE_URL}/api/v1/update/file`
      : (isMultipleFiles
        ? `${import.meta.env.VITE_BASE_URL}/api/v1/upload-multiple/file`
        : `${import.meta.env.VITE_BASE_URL}/api/v1/upload/file`);
  
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
    const filterAttachments = (attachments, response) => {
      return attachments.filter(item => !response.includes(item));
    };
    
    const attachmentArray = formDataSub.attachment ? formDataSub.attachment.split(',').map(att => att.trim()) : [];

    const responseFilenames = Array.isArray(uploadObjectData.data.filename) 
      ? uploadObjectData.data.filename 
      : [uploadObjectData.data.filename];
    
    let fileNames = [];
    
    if (attachmentArray.length > 0) {
      fileNames = filterAttachments(attachmentArray, uploadObjectData.data.filename);
      for (const file of responseFilenames) {
        if (!attachmentArray.includes(file)) {
          fileNames.push(file);
        }
      }
    } else {
      fileNames = responseFilenames;
    }
    
    setFilesEvent([]);
    setEditedFileSub([])
    return fileNames.join(',')
  };

  const sendFormDataSubTask = async (formDataSub, fileNames, decryptedUserId, isEditingSub, token) => {
    const formDataToSend = {
      ...formDataSub,
      attachment: fileNames,
      created_by: decryptedUserId,
      updated_by: isEditingSub ? decryptedUserId : undefined,
    };

    const encryptedDataToSend = encryptPayload(JSON.stringify(formDataToSend));
    const method = isEditingSub ? "PUT" : "POST";
    const endpoint = isEditingSub
      ? `/api/v1/subtasklist/${formDataSub.kode}/edit`
      : "/api/v1/subtasklist/store";

    const response = await fetch(`${import.meta.env.VITE_BASE_URL}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: method,
      body: JSON.stringify({ msg: encryptedDataToSend }),
    });

    const data = await response.json();
    const decryptedData = decryptPayload(data.msg);
    return JSON.parse(decryptedData);
  };

  const handleSubmitSubTask = async () => {
  
    try {
      setLoading({submitSubtask: true})
      const token = Cookies.get('TOKEN');
      const rawUserId = Cookies.get('USER_ID');
      const decryptedUserId = decryptPayload(rawUserId);

      let fileName = formDataSub.attachment; // Default ke attachment lama

      // Cek apakah ada file baru yang ditambahkan atau hanya file lama
      // const isFileChanged = filesEvent.length > 0 && filesEvent[0].name !== formDataSub.attachment;
      // console.log("isFileChanged:", isFileChanged);

      // Hanya upload file jika ada file baru yang berbeda dari file lama
      if (formDataSub.attachment || filesEvent.length > 0) {
        fileName = await uploadFileSubTask(formDataSub, token, isEditingSub);
      }


      // Validasi range startdate dan duedate
      const { startdate, duedate } = TABLE_ROWS.find((item) => item.kode === selectedTask.kode);

      if (
        new Date(formDataSub.startdate) < new Date(startdate) ||
        new Date(formDataSub.duedate) > new Date(duedate)
      ) {
        setNotification({
          open: true,
          message: `Start Date and End Date must be within the parent task’s date range. (${formatDate(startdate)} until ${formatDate(duedate)})`,
          isError: true,
        });
        return;
      }

      // formDataToSend menyertakan attachment lama jika tidak ada file baru
      const formDataToSend = {
        ...formDataSub,
        quality_control: formData.quality_control,
        attachment: fileName,
        created_by: decryptedUserId,
        updated_by: isEditing ? decryptedUserId : undefined
      };

      if(!formDataToSend.mandays){
         setNotification({
          open: true,
          message: 'Masukan nilai mandays!',
          isError: true,
        });
        return;
      }
      
      
      if (parseFloat(formDataSub.mandays) < 0.5) {
        setNotification({
          open: true,
          message: 'Nilai mandays minimal 0.5',
          isError: true,
        });
        return;
      }

       if(!formDataToSend.startdate || !formDataToSend.duedate){
         setNotification({
          open: true,
          message: 'Timeline is mandatory !',
          isError: true,
        });
        return;
      }

      const objectData = await sendFormDataSubTask(formDataToSend, fileName, decryptedUserId, isEditingSub, token);

      if (objectData.status === 'success') {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || `Data ${isEditingSub ? 'Updated' : 'Added'} Successfully!`,
          isError: false,
        });
        setIsOpenSub(false);
        setIsEditingSub(false);
        setFormDataSub(prevFormData => ({
          ...prevFormData,
          kode: "",
          tasklist_id: selectedTask.kode,
          title: "",
          description: "",
          attachment: "",
          status_id: "",
          startdate: "",
          duedate: "",
          mandays : ""
        }));
        fetchProjectSubTask(selectedTask.kode);
      } else {
        setNotification({
          open: true,
          message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
          isError: true,
        });
      }
    } catch (error) {
      console.error("Error handling submit: ", error);
      setNotification({
        open: true,
        message: 'An Unexpected Error Occurred. Please Try Again Later.',
        isError: true,
      });
    } finally {
      setLoading({submitSubtask:false})
    }
  };


  const handleEditTask = (kode) => {
    const tasklist = TABLE_ROWS.find((tasklist) => tasklist.kode === kode);
    if (tasklist) {

      getSelectedUsername({
        quality_control: tasklist.quality_control,
        sales: tasklist.sales,
        infra: tasklist.infra,
        sub_pi: tasklist.sub_pi
      })

      setFormData({
        kode: tasklist.kode,
        title: tasklist.title,
        description: tasklist.description,
        attachment: tasklist.attachment,
        startdate: tasklist.startdate,
        duedate: tasklist.duedate,
        status_id: tasklist.status_id,
        project_id: tasklist.project_id,
        assignee: tasklist.assignee_id,
        business_analyst: tasklist.business_analyst,
        task_severity: tasklist.task_severity,
        quality_control: tasklist.quality_control,
        sales: tasklist.sales,
        infra: tasklist.infra,
        sub_pi: tasklist.sub_pi,
        mandays : tasklist.mandays === null ? 1 : tasklist.mandays,
        project_manager : tasklist.project_manager
      });
      setFilesEvent(tasklist.attachment ? tasklist.attachment.split(',').map(name => ({ name })) : []);
      setIsEditing(true);
      setIsOpen(true);
      setEditedFile([])
    }
  };

  const handleOpenModalDelete = (kode,mode,tasklist_id)=>{
    setOpenModalDelete(true)
    // const tasklist = TABLE_ROWS.find((tasklist) => tasklist.kode === kode);
    // console.log('projecttttt',tasklist)
    const url = mode === 'task' ? `${import.meta.env.VITE_BASE_URL}/api/v1/task-list/${kode}/delete` : `${import.meta.env.VITE_BASE_URL}/api/v1/subtasklist/${kode}/delete` ;
    setDataDelete({kode,url,mode,tasklist_id})
  }

  const handleDeleteTask = async (data) => {
    const tasklist = TABLE_ROWS.find((tasklist) => tasklist.kode === data.kode);
    const dataSubtask = subtasklist.find((task) => task.kode === data.kode);
    
    if (tasklist || dataSubtask) {
      const payloadDelete = {
        is_active : '0'
      }
      try {
        
        const objectData = await apiRequest(data.url,'DELETE',payloadDelete);
        if (objectData.status === 'success') {
          setNotification({
            open: true,
            message: capitalizeWords(objectData.message) || `Data Delete Successfully!`,
            isError: false,
          });
          data.mode === 'task' ? fetchProjectTask() : fetchProjectSubTask(data.tasklist_id);
          setOpenModalDelete(false)
        } else {
          setNotification({
            open: true,
            message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
            isError: true,
          });
        }
      } catch (error) {
        console.error("Error handling delete: ", error);
        setNotification({
          open: true,
          message: 'An Unexpected Error Occurred. Please Try Again Later.',
          isError: true,
        });
      }
     
    }
    
  };
  

  const tableRows = currentPageData.map((row) => {
    const tdPadding = !projectSelected || isLoading ? "p-4" : "p-2";

    return (
      <tr key={row.kode} className="border-b border-gray-200 font-poppins text-xs" style={{ color: '#212529' }}>
        {formData.project_id && (
          <>
            <td className={`border border-gray-300 ${tdPadding}`}>
              <div className="flex items-center">
                <IconButton variant="text" color="blue" onClick={() => handleEditTask(row.kode)}>
                  <PencilIcon className="h-5 w-5" />
                </IconButton>
                {/* <IconButton variant="text" color="red" onClick={() => handleDeleteTask(row.kode)}>
                  <XCircleIcon className="h-5 w-5" />
                </IconButton> */}
                <IconButton variant="text" color="red" onClick={() => handleOpenModalDelete(row.kode,'task')}>
                  <TrashIcon className="h-5 w-5" />
                </IconButton>
              </div>
            </td>
            <td className={`border border-gray-300 ${tdPadding}`}>
              <div className="flex items-center">
                <IconButton variant="text" color="blue" onClick={() => handleDetailClick(row)}>
                  <InformationCircleIcon onClick={() => fetchProjectSubTask(row.kode)} className="h-5 w-5" />
                </IconButton>
              </div>
            </td>
          </>
        )}
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.kode)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.title)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.task_severity)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(formatDate(row.startdate,true))}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(formatDate(row.duedate,true))}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.mandays)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.status_id)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.project_manager_name)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.business_analyst)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.quality_control)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.sales)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.infra)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.sub_pi)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.assignee)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.created_by_name)}</td>
        <td className={`border border-gray-300 ${tdPadding}`}>{highlightText(row.updated_by_name)}</td>
      </tr>
    );
  });

  const pageCount = Math.ceil(filteredRows.length / PER_PAGE);
  

  const getUsernamesForProject = (project_id,idData = false) => {
    const projectAssignees = userNotification.filter(p => p.project_id === project_id);
    let usernames
    // Ambil semua nama assignee dan hilangkan duplikat jika ada
    if(idData){
    usernames = [
      ...new Set(
        projectAssignees.map((item)=>{
          return {
            assignee_name : item.assignee_name,
            assignee_id : item.assignee_id
          }
        })
      )
    ];
    } else {
    usernames = [
      ...new Set(
        projectAssignees.map(assignee => assignee.assignee_name)
      )
    ];
    }

    return usernames;
  };

const getUseridForProject = (project_id) => {
    const projectAssignees = userNotification.filter(p => p.project_id === project_id);
    const seen = new Set();
    const uniqueAssignees = projectAssignees.filter(assignee => {
        if (seen.has(assignee.assignee_id)) {
            return false;
        }
        seen.add(assignee.assignee_id);
        return true;
    }).map(assignee => ({
        assignee_name: assignee.assignee_name,
        assignee_id: assignee.assignee_id
    }));
    
    return uniqueAssignees;
};

  const handleProjectChange = (value) => {
    setShowDetail(false);
    setSelectedTask(null);
    setFormData(prevFormData => ({
      ...prevFormData,
      project_id: value,
    }));
    setProjectKey(prevKey => prevKey + 1);
    setSelectedStatusFilter("")
    setCurrentPage(0)
  };



  const projectOptions = projectAssignment
    .filter((project) => {

      if (selectedDivisionFilter) {
        return project.division == selectedDivisionFilter;
      }
      return true; 
    })
    .map((project) => ({
      value: project.project_id,
      label: project.project_name,
    }));
  
  console.log('test',projectAssignment)
  console.log('test2',selectedDivisionFilter)

  const projectStatus = projectAssignment
    .filter(project => project.project_id === formData.project_id)
    .flatMap(project => {
      const statuses = project.project_status.split(',');

      const formattedStatuses = statuses
        .filter(status => status.trim())
        .map(status => ({
          value: status.trim(),
          label: status.trim(),
          project_id: project.project_id
        }));

      return formattedStatuses;
    });


  useEffect(() => {
 
  if (selectedDivisionFilter) {
    // Kosongkan TABLE_ROWS dan reset projectSelected
    setTABLE_ROWS([]);
  }

  if(projectOptions.length > 0  && selectedDivisionFilter === ''){
    fetchProjectTask();
  }

}, [selectedDivisionFilter]);

  const LoadingOption = () => (
    <div className="flex items-center justify-center">
      <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
    </div>
  );

  //fetch projectStatus
  const fetchProjectStatus = async () => {
    setIsLoading(true);
    try {
      const responseData = await apiRequest(`${import.meta.env.VITE_BASE_URL}/api/v1/project-status`);
      processAndSetData(responseData, setDropDownProjectStatus);
    } catch (error) {
      console.error("Error fetching project status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectStatus()
  }, [])


  const projectStat = dropDownProjectStatus?.find(
    (item) => item.project_id == formData.project_id
  );

  const projectStatusOptions = projectStat?.project_status.split(",") || [];


  return (
    <>
      <Card className="h-full w-full mt-4">
        <CardHeader floated={false} shadow={false} className="rounded-none overflow-visible">
          <div className="mb-6 border-b border-gray-300 pb-3">
            <Typography className="font-poppins text-sm font-medium text-gray-600">
              Project Task Data
            </Typography>
          </div>
          <div className={`font-poppins w-72 ${!projectSelected ? 'py-2' : 'mb-5 py-1 flex w-full items-center gap-2'}`}>
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
                  minWidth : '250px',
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
        {projectSelected && (
              <Select
                options={isLoading ? [{ value: '', label: <LoadingOption /> }] : projectStatus}
                value={projectStatus.find(option => option.value === selectedStatusFilter) || null}
                onChange={(selectedOption) => {
                  if (selectedOption && selectedOption.value !== '') {
                    setSelectedStatusFilter(selectedOption.value);
                    setProjectStatusData(true);
                  } else {
                    setSelectedStatusFilter('');
                    setProjectStatusData(false);
                  }
                }}
                isSearchable={true}
                placeholder="Filter by Status"
                isClearable={true}
                styles={{
                  control: (base, state) => ({
                    ...base,
                    width: '250px',
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
                      backgroundColor: 'transparent',
                      cursor: 'default',
                      ':hover': {
                        backgroundColor: 'transparent',
                      },
                    }),
                  }),
                }}
              />
            )}

            {projectSelected && (
              <div className="w-10">
                <MaterialSelect
                  label="Filter By Division"
                  name="filter_division"
                  value={selectedDivisionFilter}
                  onChange={(value) => {
                    setSelectedDivisionFilter(value)
                  }}
                  className="font-poppins"
                >
                  {[{ id: "", description: "All Divisions" }, ...divisionData].map(item => {
                    return (
                      <Option key={item.id || "all"} value={item.id} className="font-poppins">
                        {item.description}
                      </Option>
                    );
                  })}
                </MaterialSelect>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            {projectSelected && (
              <>
                <Button
                  color="blue"
                  className="flex items-center gap-2 px-4 py-2 text-sm capitalize bg-blue-500 text-white rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 font-poppins font-medium"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      kode: "",
                      title: "",
                      description: "",
                      attachment: "",
                      duedate: "",
                      project_id: formData.project_id,
                      assignee: "",
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
              </>
            )}
          </div>
        </CardHeader>

        <CardBody className="overflow-scroll px-0">
          <table className="w-full min-w-max table-auto text-left font-poppins border border-gray-300">
            <thead className="bg-blue-gray-50/50">
              <tr>
                {TABLE_HEAD.map((head, index) => {
                  if ((head === "Detail" || head === "Actions") && !formData.project_id) {
                    return null;
                  }
                  return (
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
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${sortConfig.key === head.toLowerCase().replace(' ', '_')
                              ? 'text-gray-500'
                              : 'text-gray-500'
                              }`}
                          >
                            <i className={`fa fa-sort-${sortConfig.direction === 'ascending' ? 'up' : 'down'}`}></i>
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
                  <td colSpan={TABLE_HEAD.length} className="text-center py-10">
                    <div className="flex items-center justify-center">
                      <div className="spinner-border animate-spin inline-block w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.length > 0 ? tableRows : (
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
                  </IconButton>
                );

  
                let startPage = Math.max(1, currentPage - Math.floor((maxButtons - 4) / 2));
                let endPage = Math.min(pageCount - 2, startPage + maxButtons - 5);

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
                    </IconButton>
                  );
                }

                if (endPage < pageCount - 2) {
                  pages.push(<span key="ellipsis2">...</span>);
                }

                pages.push(
                  <IconButton
                    key={pageCount - 1}
                    variant={currentPage === pageCount - 1 ? "outlined" : "text"}
                    size="sm"
                    onClick={() => handlePageClick(pageCount - 1)}
                  >
                    {pageCount}
                  </IconButton>
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
                    </IconButton>
                  );
                }
              }

              return pages;
            })()}

            <IconButton
              variant="text"
              size="sm"
              onClick={() => handlePageClick(Math.min(pageCount - 1, currentPage + 1))}
              disabled={currentPage === pageCount - 1}
            >
              <span className="sr-only">Next</span>
              &raquo;
            </IconButton>
          </div>
        </CardFooter>
      </Card>

      {showDetail && selectedTask && (
        <div className="border-b border-gray-300 mt-20 mb-14">
          <TaskDetailCard task={selectedTask} />
        </div>
      )}

      {showDetail && selectedTask && (
        <SubTaskCard
          subtasklist={subtasklist}
          taklistKode = {selectedTask.kode}
          handleOpenModalDelete = {handleOpenModalDelete}
          handleOpenSub={() => {
            setIsEditingSub(false);
            setFormDataSub({
              kode: "",
              tasklist_id: selectedTask.kode,
              title: "",
              description: "",
              attachment: "",
              assignee: "",
              startdate: "",
              status_id: "",
              duedate: "",
              mandays: ""
            });
            setIsOpenSub(true);
          }}
          handleEditSubTask={(subtask) => {
            setIsEditingSub(true);
            setFormDataSub({
              kode: subtask.kode,
              title: subtask.title,
              description: subtask.description,
              attachment: subtask.attachment,
              assignee: subtask.assignee_id,
              tasklist_id: subtask.tasklist_id,
              startdate: formatDate(subtask.startdate,true),
              status_id: subtask.status_id,
              duedate: formatDate(subtask.duedate,true),
              mandays : subtask.mandays === null ? 1 : subtask.mandays
            });
            setFilesEvent(subtask.attachment ? subtask.attachment.split(',').map(name => ({ name })) : []);
            setIsOpenSub(true);
          }}
        />
      )}

   <Dialog open={isOpenSub} handler={() => { }} dismiss={{ outsidePointerDown: false, escapeKeyDown: false }} size="lg">
      <DialogHeader className="font-poppins text-xl font-semibold border-b pb-4">
        {isEditingSub ? "Edit Project Sub Task" : "Add Project Sub Task"}
      </DialogHeader>
      
      <DialogBody className="max-h-[70vh] overflow-y-auto font-poppins">
        {/* Grid Layout - 3 Sections for Sub Task */}
        <div className="space-y-6">
          {/* Section 1: Basic Information - Full Width */}
          <div>
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 font-poppins">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <Input
                label="Sub Task Name"
                name="title"
                value={formDataSub.title}
                onChange={handleChangeSub}
                className="font-poppins"
              />
              
              {/* Empty column for proper spacing */}
              <div className="mt-[-15px]">
                <AssigneeSelector
                  formDataSub={formDataSub}
                  isEditingSub={isEditingSub}
                  isLoading={isLoading}
                  handleAssigneeChange={(value) => {
                    setFormDataSub({ ...formDataSub, assignee: value });
                  }}
                  dataPlace={'bottom'}
                  projectAssignees={getUsernamesForProject(formData.project_id, true)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Description - Full Width */}
          <div className="border-t pt-6">
            <div className="space-y-3">
              <label className="text-lg font-semibold text-gray-800 font-poppins">
                Description
              </label>
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-blue-300 transition-colors duration-200">
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                  <CKEditor
                    editor={ClassicEditor}
                    data={formDataSub.description}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setFormDataSub({ ...formDataSub, description: data });
                    }}
                    config={{
                      toolbar: {
                        items: [
                          'undo', 'redo', '|',
                          'bold', 'italic', '|',
                          'link', '|',
                          'bulletedList', 'numberedList'
                        ],
                      },
                      placeholder: 'Write sub task description here...',
                      minHeight: '100px'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-gray-600 font-poppins">
                      Rich text editor
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-poppins">
                    Use formatting tools above
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 font-poppins flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Provide detailed description of the sub task</span>
              </p>
            </div>
          </div>

          {/* Section 3: Timeline & Assignment - Full Width */}
          <div className="border-t pt-6">
            <div className="border-b pb-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-800 font-poppins">Timeline & Assignment</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Start Date"
                  name="startdatesub"
                  type="datetime-local"
                  value={formDataSub.startdate}
                  onChange={(event) => {
                    setFormDataSub({ ...formDataSub, startdate: event.target.value });
                  }}
                  className="font-poppins"
                />
                
                <Input
                  label="Due Date"
                  name="duedatesub"
                  type="datetime-local"
                  value={formDataSub.duedate}
                  onChange={(event) => {
                    setFormDataSub({ ...formDataSub, duedate: event.target.value });
                  }}
                  className="font-poppins"
                />
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Mandays"
                  name="mandayssub"
                  type="number"
                  min={0.5}
                  step={0.1}
                  value={formDataSub.mandays}
                  onChange={(event) => {
                    setFormDataSub({ ...formDataSub, mandays: event.target.value });
                  }}
                  className="font-poppins"
                />
                
                <MaterialSelect
                  label="Sub Task Status"
                  name="projectStatus"
                  value={formDataSub.status_id}
                  onChange={(value) => {
                    setFormDataSub({ ...formDataSub, status_id: value });
                  }}
                  className="font-poppins"
                >
                  {projectStatusOptions.map((status) => (
                    <Option key={status} value={status} className="font-poppins">
                      {status.replace("_", " ")}
                    </Option>
                  ))}
                </MaterialSelect>
              </div>
            </div>
            

          </div>

          {/* Section 4: Attachments - Full Width */}
          <div className="border-t pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 font-poppins">Attachments</h3>
              
              <div
                {...getRootProps({
                  className:
                    "dropzone border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors duration-200 bg-gray-50",
                })}
              >
                <input {...getInputProps()} />
                <div className="text-blue-gray-400 text-2xl mb-3">
                  <ArrowUpTrayIcon className="h-8 w-8" />
                </div>
                <p className="text-blue-gray-600 text-sm font-medium font-poppins mb-1">
                  Drag & Drop files here or click to browse
                </p>
                <p className="text-blue-gray-400 text-xs font-poppins">
                  Support for various file formats
                </p>
              </div>

              {filesEvent.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 font-poppins">
                    Uploaded Files ({filesEvent.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filesEvent.map((file, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="truncate text-gray-700 text-sm font-poppins">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFileSub(file.name)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogBody>
      
      <DialogFooter className="border-t pt-2">
        <Button
          variant="text"
          color="red"
          onClick={() => setIsOpenSub(false)}
          className="mr-3 font-poppins"
        >
          <span className="font-semibold">Cancel</span>
        </Button>
        <Button
          variant="gradient"
          color="green"
          onClick={handleSubmitSubTask}
          disabled={loading.submitSubtask}
          className="font-poppins min-w-[120px]"
        >
          {loading.submitSubtask ? (
            <Spinner color="white" className="h-4 w-4" />
          ) : (
            <span className="font-semibold">
              {isEditingSub ? "Save Changes" : "Add Sub Task"}
            </span>
          )}
        </Button>
      </DialogFooter>
    </Dialog>

   <Dialog open={isOpen} handler={() => { }} dismiss={{ outsidePointerDown: false, escapeKeyDown: false }} size="xl">
        <DialogHeader className="font-poppins text-xl font-semibold border-b pb-4">
          {isEditing ? "Edit Project Task" : "Add Project Task"}
        </DialogHeader>
        
        <DialogBody className="overflow-auto lg:py-6 lg:max-h-[75vh] max-h-[500px] font-poppins">
          {/* Grid Layout - 4 Sections */}
          <div className="space-y-8">
            {/* Section 1: Basic Information - Full Width */}
            <div>
              <div className="border-b pb-3 mb-4">
                <h3 className="text-lg font-semibold text-gray-800 font-poppins">Basic Information</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Input
                  label="Task Name"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="font-poppins"
                />
                
                <MaterialSelect
                  label="Task Severity"
                  name="taskSeverity"
                  value={formData.task_severity}
                  onChange={(value) => {
                    setFormData({ ...formData, task_severity: value });
                  }}
                  className="font-poppins"
                >
                  <Option value="HIGH" className="font-poppins text-red-600">🔴 High</Option>
                  <Option value="MEDIUM" className="font-poppins text-yellow-600">🟡 Medium</Option>
                  <Option value="LOW" className="font-poppins text-green-600">🟢 Low</Option>
                </MaterialSelect>
              </div>
            </div>

            {/* Section 2: Description - Full Width */}
            <div className="border-t pt-6">
              <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-800 font-poppins">
                  Description
                </label>
                
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-blue-300 transition-colors duration-200">
                  <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    <CKEditor
                      editor={ClassicEditor}
                      data={formData.description}
                      onChange={(event, editor) => {
                        const data = editor.getData();
                        setFormData({ ...formData, description: data });
                      }}
                      config={{
                        toolbar: {
                          items: [
                            'undo', 'redo', '|',
                            'bold', 'italic', '|',
                            'bulletedList', 'numberedList'
                          ],
                        },
                        placeholder: 'Write task description here...',
                        minHeight: '120px'
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 font-poppins">
                        Rich text editor
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-poppins">
                      Use formatting tools above
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 font-poppins flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Provide detailed description of the task objectives and requirements</span>
                </p>
              </div>
            </div>

            {/* Section 3: Timeline & Status and Assignment & Resources (2 columns) */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Timeline & Status */}
                <div className="space-y-6">
                  <div className="border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 font-poppins">Timeline & Status</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <Input
                      label="Start Date"
                      name="startdate"
                      type="datetime-local"
                      value={formData.startdate}
                      onChange={handleChange}
                      className="font-poppins"
                    />
                    
                    <Input
                      label="Due Date"
                      name="duedate"
                      type="datetime-local"
                      value={formData.duedate}
                      onChange={handleChange}
                      className="font-poppins"
                    />
                    
                    <Input
                      label="Mandays"
                      name="mandays"
                      type="number"
                      min={0.5}
                      step={0.1}
                      value={formData.mandays}
                      onChange={handleChange}
                      className="font-poppins"
                    />
                    
                    <MaterialSelect
                      label="Task Status"
                      name="projectStatus"
                      value={formData.status_id}
                      onChange={(value) => {
                        setFormData({ ...formData, status_id: value });
                      }}
                      className="font-poppins"
                    >
                      {projectStatusOptions.map((status) => (
                        <Option key={status} value={status} className="font-poppins">
                          {status.replace("_", " ")}
                        </Option>
                      ))}
                    </MaterialSelect>
                  </div>
                </div>

                {/* Assignment & Resources */}
                <div className="space-y-6">
                  <div className="border-b pb-3 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 font-poppins">Assignment & Resources</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Team Roles */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 font-poppins">
                        Team Roles
                      </label>
                      {roles.map(({ key, label }) => (
                        <div key={key}>
                          <Multiselect
                            options={user}
                            selectedValues={isEditing ? selectedQuality[key] : null}
                            onSelect={(selectedList) => handleSelect(key, selectedList)}
                            onRemove={(selectedList) => handleRemove(key, selectedList)}
                            displayValue="name"
                            placeholder={label}
                            style={customStyles}
                            className="text-sm font-poppins"
                          />
                        </div>
                      ))}
                    </div>
                  <MaterialSelect
                  label="Project Manager"
                  name="project_manager"
                  value={formData.project_manager}
                  onChange={(value) => {
                      console.log("Selected project_manager:", value);
                      setFormData({ ...formData, project_manager: value });
                  }}
              >
                  {getUseridForProject(formData.project_id).map(username => {
                      
                      return (
                          <Option 
                              key={username.assignee_id} 
                              value={username.assignee_id} 
                              className="font-poppins"
                          >
                              {username.assignee_name}
                          </Option>
                      );
                  })}
              </MaterialSelect>
                    <MaterialSelect
                      label="Business Analyst"
                      name="bussiness_analyst"
                      value={formData.business_analyst}
                      onChange={(value) => {
                        setFormData({ ...formData, business_analyst: value });
                      }}
                      className="font-poppins"
                    >
                      {getUsernamesForProject(formData.project_id)
                        .sort((a, b) => a.localeCompare(b))
                        .map(assignee_name => {
                          return (
                            <Option key={assignee_name} value={assignee_name} className="font-poppins">
                              {assignee_name}
                            </Option>
                          );
                        })}
                    </MaterialSelect>
                    
                    <AssigneeSelector
                      formDataSub={formData}
                      isEditingSub={isEditing}
                      isLoading={isLoading}
                      handleAssigneeChange={(value) => {
                        setFormData({ ...formData, assignee: value });
                      }}
                      projectAssignees={userNotification
                        .filter(p => p.project_id === formData.project_id)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Section 4: Attachments - Full Width */}
            <div className="border-t pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 font-poppins">Attachments</h3>
                
                <div
                  {...getRootProps({
                    className:
                      "dropzone border-2 border-dashed border-blue-gray-200 rounded-lg p-6 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors duration-200",
                  })}
                >
                  <input {...getInputProps()} />
                  <div className="text-blue-gray-400 text-2xl mb-3">
                    <ArrowUpTrayIcon className="h-8 w-8" />
                  </div>
                  <p className="text-blue-gray-600 text-sm font-medium font-poppins mb-1">
                    Drag & Drop files here or click to browse
                  </p>
                  <p className="text-blue-gray-400 text-xs font-poppins">
                    Support for various file formats
                  </p>
                </div>

                {filesEvent.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 font-poppins">
                      Uploaded Files ({filesEvent.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filesEvent.map((file, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-50 rounded-lg p-3 border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="truncate text-gray-700 text-sm font-poppins">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(file.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogBody>
        
        <DialogFooter className="border-t pt-4">
          <Button
            variant="text"
            color="red"
            onClick={() => {
              setIsOpen(false)
              setEditedFile([])
              setFilesEvent([])
              setSelectedQuality([])
            }}
            className="mr-3 font-poppins"
          >
            <span className="font-semibold">Cancel</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={handleSubmitTask}
            disabled={loading.submitTask}
            className="font-poppins min-w-[100px]"
          >
            {loading.submitTask ? (
              <Spinner color="white" className="h-4 w-4" />
            ) : (
              <span className="font-semibold">
                {isEditing ? "Save Changes" : "Add Task"}
              </span>
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <NotificationDialog
        open={notification.open}
        setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
        message={notification.message}
        isError={notification.isError}
      />

      <ModalDelete handleDeleteTask={handleDeleteTask}/>
    </>
  );
}