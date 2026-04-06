import { useDashboard } from '@/zustand'
import React from 'react'
import ApexCharts from "react-apexcharts";
import { green600, orange600, rose600, blue600, slate600, purple600 } from "@/utils/chart-colors";
import { Card, CardHeader, Typography, Button, CardBody, CardFooter, IconButton, Input, Textarea, Dialog, DialogHeader, DialogBody, DialogFooter, Option, MaterialSelect } from "@material-tailwind/react";
import { XCircleIcon } from '@heroicons/react/24/solid';
import DetailStatus from './DetailStatus';

const ModalProgres = () => {
    const {openModal, setOpenModal, dataProgres, setOpenDetail,setPayloadStatus,setCurrentPage} = useDashboard()
    // console.log('data progress',dataProgres)

    const generatePieData = (statuses, isAssignment = false) => {
        const labels = statuses.map(status => status.status_name);
        const data = statuses.map(status => parseFloat(status.percentage.replace('%', '')));
      
        const colors = isAssignment 
          ? [rose600, blue600, green600, orange600, slate600, purple600]
          : [purple600, slate600, orange600, green600, blue600, rose600];
      
        return {
          series: data,
          options: {
            chart: {
              type: 'pie',
              height: 300,
            },
            labels: labels,
            colors: colors,
            legend: {
              position: 'bottom',
              fontSize: '11px',
              fontFamily: 'Poppins, sans-serif',
              labels: {
                colors: '#212529',
              },
              markers: {
                shape: 'square',
                size: 6,
                offsetX: -4,
              },
              itemMargin: {
                horizontal: 5,
                vertical: 5,
              },
            },
            tooltip: {
              y: {
                formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
              },
              style: {
                fontFamily: 'Poppins, sans-serif',
              },
            },
            dataLabels: {
              enabled: true,
              dropShadow: {
                enabled: false,
              },
              formatter: (value, { seriesIndex }) => `${statuses[seriesIndex].percentage}`,
              style: {
                fontFamily: 'Poppins, sans-serif',
                fontSize: '10px',
              },
              textAnchor: 'middle',
              offset: -10,
            },
            plotOptions: {
              pie: {
                dataLabels: {
                  offset: -10,
                  minAngleToShowLabel: 10,
                },
              },
            },
          }
        };
    };

    // Function to determine text color based on status name
    const getStatusColor = (statusName) => {
        const statusLower = statusName.toLowerCase();
        if (statusLower.includes('done') || statusLower.includes('closed')) return 'text-green-600 hover:font-extrabold duration-100 font-medium';
        if (statusLower.includes('in progress')) return 'text-blue-600 hover:text-blue-700 hover:font-extrabold duration-100   font-medium';
        if (statusLower.includes('issue') || statusLower.includes('log')) return 'text-blue-600 hover:font-extrabold duration-100 hover:font-extrabold duration-100   font-medium';
        if (statusLower.includes('test') || statusLower.includes('qc')) return 'text-blue-600 hover:font-extrabold duration-100  font-medium';
        if (statusLower.includes('to do')) return 'text-blue-600 hover:font-extrabold duration-100  font-medium';
        return 'text-gray-700 hover:font-extrabold duration-100 font-medium';
    };

    const handleOpenDetail = (project_id,status_id,status_name)=>{
        setPayloadStatus({
            project_id,
            status_id,
            status_name
        })
        setOpenDetail(true)
        setCurrentPage(0)
    }
    
    return (
        <Dialog 
            open={openModal} 
            handler={() => {}}
            dismiss={{
            outsidePointerDown: false,
            escapeKeyDown: false,
            }} 
            style={{ height: '90vh' }}
            size='xl'
        >
            <DialogHeader className="font-poppins flex justify-between items-center text-xl font-semibold">
                {dataProgres.project_name || 'No Selected Project'}
                <Button
                    variant="text"
                    color="red"
                    onClick={() => setOpenModal(false)}
                    className="mr-2"
                >
                    <XCircleIcon className="h-5 w-5" />
                </Button>
            </DialogHeader>
            <DialogBody divider className="max-h-[800px] overflow-y-scroll w-full">
            <div className='h-[70vh] w-full flex justify-between'>
                <div className="w-[40%] flex-col h-full p-2 border-[1px] border-t-[2px] border-t-blue-500 rounded-md border-gray-600/20 flex justify-center items-center gap-2">
                    <div className='text-[14px] font-bold text-gray-800'>Pie Chart: {dataProgres?.project_name}</div>
                    {dataProgres && dataProgres.statuses && (
                        <ApexCharts
                            options={generatePieData(dataProgres.statuses, false).options}
                            series={generatePieData(dataProgres.statuses, false).series}
                            type="pie"
                            height={300}
                        />
                    )}
                </div>
                <div className='flex flex-col justify-between w-[58%]'>
                    <div className="w-full h-full flex-col p-2 border-[1px] border-t-[2px] border-t-blue-500 rounded-md border-gray-600/20 flex items-baseline">
                        <div className='text-[14px] font-bold text-gray-800 mb-3'>Issue Statistics: {dataProgres?.project_name}</div>
                        
                        {/* Issue Statistics Table */}
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-max table-auto text-left">
                                <thead>
                                    <tr>
                                        <th className="border-b border-gray-200 bg-gray-50 p-2 w-[40%]">
                                            <Typography variant="small" className="font-semibold leading-none text-gray-700">
                                                Status
                                            </Typography>
                                        </th>
                                        <th className="border-b border-gray-200 bg-gray-50 p-2">
                                            <Typography variant="small" className="font-semibold leading-none text-gray-700">
                                                Count
                                            </Typography>
                                        </th>
                                        <th className="border-b border-gray-200 bg-gray-50 p-2 w-1/2">
                                            <Typography variant="small" className="font-semibold leading-none text-gray-700">
                                                Percentage
                                            </Typography>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataProgres && dataProgres.statuses && dataProgres.statuses.map((status, index) => {
                                        const percentage = parseFloat(status.percentage.replace('%', ''));
                                        return (
                                            <tr key={index} className="even:bg-gray-50/50">
                                                <td className="p-2 border-b border-gray-200 cursor-pointer" onClick={()=> handleOpenDetail(dataProgres.project_id,status.status_id,status.status_name)}>
                                                    <Typography variant="small" className={getStatusColor(status.status_name)} >
                                                        {status.status_name}
                                                    </Typography>
                                                </td>
                                                <td className="p-2 border-b border-gray-200">
                                                    <Typography variant="small" className="font-normal text-blue-600">
                                                        {status.task_count}
                                                    </Typography>
                                                </td>
                                                <td className="p-2 border-b border-gray-200">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                        <Typography variant="small" className="font-normal">
                                                            {status.percentage}
                                                        </Typography>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {dataProgres && dataProgres.statuses && (
                                        <tr className="bg-gray-50">
                                            <td className="p-2 border-t border-gray-300">
                                                <Typography variant="small" className="font-semibold text-gray-700">
                                                    Total
                                                </Typography>
                                            </td>
                                            <td className="p-2 border-t border-gray-300">
                                                <Typography variant="small" className="font-semibold text-blue-600">
                                                    {dataProgres.statuses.reduce((sum, status) => sum + parseInt(status.task_count), 0)}
                                                </Typography>
                                            </td>
                                            <td className="p-2 border-t border-gray-300"></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {/* <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                <span>5 minutes ago</span>
                            </div> */}
                        </div>
                    </div>
      
                </div>
            </div>
            </DialogBody>
{/* 
            <DialogFooter>
                <Button
                    variant="text"
                    color="red"
                    onClick={() => setOpenModal(false)}
                    className="mr-2"
                >
                    <span className="font-poppins font-semibold">Cancel</span>
                </Button>
                <Button
                    variant="gradient"
                    color="green"
                    // onClick={handleSubmit}
                >
                    <span className="font-poppins font-semibold">Confirm</span>
                </Button>
            </DialogFooter> */}
        {/* <DetailStatus/> */}
        </Dialog>
    )
}

export default ModalProgres