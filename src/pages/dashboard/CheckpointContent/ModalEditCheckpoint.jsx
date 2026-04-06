import { useTasklist } from '@/zustand'
import React, { useState, useEffect } from 'react'
import { 
  Card, CardHeader, Typography, Button, CardBody, 
  CardFooter, IconButton, Input, Textarea, Dialog, 
  DialogHeader, DialogBody, DialogFooter, Option, 
  Select as MaterialSelect 
} from "@material-tailwind/react";
import { XCircleIcon } from '@heroicons/react/24/solid';
import { ProjectCheckpoint } from '@/configs/models';
import { decryptPayload } from '@/services/codec/codec';
import Cookies from 'js-cookie';
import { UseCheckpoint } from '@/configs/ViewModels';
import NotificationDialog from '@/components/NotificationDialog';
import { capitalizeWords } from '@/utils/helper';


const ModalEditCheckpoint = ({ isOpen, setIsOpen, formData, setFormData, setTABLE_ROWS, TABLE_ROWS }) => {
  const { fetchDataCheckpoint } = UseCheckpoint();
    const [notification, setNotification] = useState({ open: false, message: '', isError: false });

  const handleSubmit = async () => {
    try {
      if (!formData) return;
      
      let payload = {
        id: formData.id,
        status: formData.status
      };

      // Add additional fields based on status
      if (formData.status === 'reschedule') {
        if (!formData.duedate) {
          alert('Please select a due date');
          return;
        }
        payload = {
          ...payload,
          duedate: formData.duedate,
          note: formData.note || ''
        };
      } else if (formData.status === 'complete') {
        payload = {
          ...payload,
          note: formData.note || ''
        };
      }

      const objectData = await ProjectCheckpoint.editCheckpoint(payload);

            if (objectData.status === 'success') {
              setNotification({
                open: true,
                message: capitalizeWords(objectData.message) || `Data Updated Successfully!`,
                isError: false,
              });
            const result = await fetchDataCheckpoint(formData.project_id);
            if(result.data){
                setTABLE_ROWS(result.data)
                setIsOpen(false);
        }
            } else {
              setNotification({
                open: true,
                message: capitalizeWords(objectData.message) || 'An Error Occurred While Saving The Data.',
                isError: true,
              });
            }
     
    } catch (error) {
        setNotification({
        open: true,
        message: 'An Unexpected Error Occurred. Please Try Again Later.',
        isError: true,
        });
    }
  };


  const [initialStatus] = useState(formData?.status);


  const getStatusOptions = () => {
    const allOptions = [
      { description: 'To Do', data: 'todo' },
      { description: 'Reschedule', data: 'reschedule' },
      { description: 'Complete', data: 'complete' },
    ];

 
    if (initialStatus === 'todo') {
      return allOptions;
    }

    if (formData?.status === 'reschedule') {
      return allOptions.filter(option => option.data === 'reschedule' || option.data === 'complete');
    }
    

    return allOptions;
  };


  const getDropdownOptions = () => {
    const options = getStatusOptions();
    

    if (initialStatus === 'todo') {
      return options.filter(option => option.data !== 'todo');
    }
    
    return options;
  };


  const isInputDisabled = TABLE_ROWS?.find(item => item.id === formData?.id)?.status === 'complete';

  return (
    <>
    <Dialog 
      open={isOpen} 
      handler={() => {}}
      dismiss={{
        outsidePointerDown: false,
        escapeKeyDown: false,
      }} 
      size='md'
    >
      <DialogHeader className="font-poppins flex justify-between items-center text-xl font-semibold">
        Edit Checkpoint
      </DialogHeader>
      
      <DialogBody divider className="max-h-[800px] w-full">
        <div className='flex justify-center flex-col gap-4'>
          <MaterialSelect
            label="Status"
            name="status"
            value={formData?.status || ""}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value }))
            }
            disabled={isInputDisabled}
          >
            {getDropdownOptions().map((option) => (
              <Option key={option.data} value={option.data}>
                {option.description}
              </Option>
            ))}
          </MaterialSelect>

          {formData?.status === 'reschedule' && (
            <div className='flex flex-col items-center gap-4'>
             <Input 
                label='Due Date' 
                type='date'
                value={formData?.duedate || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, duedate: e.target.value }))
                }
                disabled={isInputDisabled}
              />
              <Textarea 
                label='Note' 
                value={formData?.note || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
                disabled={isInputDisabled}
              />

            </div>
          )}

          {formData?.status === 'complete' && (
            <Textarea 
              label='Note'
              value={formData?.note || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, note: e.target.value }))
              }
              disabled={isInputDisabled}
            />
          )}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button
          variant="text"
          color="red"
          onClick={() => setIsOpen(false)}
          className="mr-2"
        >
          <span className="font-poppins font-semibold">Cancel</span>
        </Button>
        <Button
          variant="gradient"
          color="green"
          onClick={handleSubmit}
          disabled={isInputDisabled}
        >
          <span className="font-poppins font-semibold">Confirm</span>
        </Button>
      </DialogFooter>
    </Dialog>
          <NotificationDialog
            open={notification.open}
            setOpen={(isOpen) => setNotification({ ...notification, open: isOpen })}
            message={notification.message}
            isError={notification.isError}
          />
    </>
    
  );
};

export default ModalEditCheckpoint;