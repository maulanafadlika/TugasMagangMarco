import { useTasklist } from '@/zustand'
import React from 'react'
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, MaterialSelect } from "@material-tailwind/react";
import { XCircleIcon } from '@heroicons/react/24/solid';

const ModalDelete = ({handleDeleteTask}) => {
    const {openModalDelete, setOpenModalDelete,dataDelete } = useTasklist()
   
    return (
        <Dialog 
            open={openModalDelete} 
            handler={() => {}}
            dismiss={{
            outsidePointerDown: false,
            escapeKeyDown: false,
            }} 
            size='md'
        >
            <DialogHeader className="font-poppins flex justify-between items-center text-xl font-semibold">
                Delete Project {dataDelete.mode === 'task' ? 'Task' : 'Sub-Task'} {dataDelete.kode || ''}
            </DialogHeader>
            <DialogBody divider className="max-h-[800px] w-full">
                <div>Apakah anda ingin menghapus {dataDelete.mode === 'task' ? 'task' : 'sub-task'} project ini ? </div>
            </DialogBody>

            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={() => setOpenModalDelete(false)}
                    className="mr-2"
                >
                    <span className="font-poppins font-semibold">Cancel</span>
                </Button>
                <Button
                    variant="gradient"
                    color="green"
                    onClick={()=> handleDeleteTask(dataDelete)}
                >
                    <span className="font-poppins font-semibold">Confirm</span>
                </Button>
            </DialogFooter>
        </Dialog>
    )
}

export default ModalDelete