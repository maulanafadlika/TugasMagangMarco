import { useUploadFile } from '@/zustand';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { Typography } from '@material-tailwind/react';
import React from 'react';
import { useDropzone } from 'react-dropzone';

const MultipleUpload = ({type}) => {
  const { filesEvent, setFilesEvent } = useUploadFile();


  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFilesEvent(type, (prevFiles) => [...prevFiles, ...acceptedFiles]);
    },
  });

  const removeFile = (fileName) => {
    setFilesEvent(type, (prevFiles) =>
      prevFiles.filter((file) => file.name !== fileName)
    );
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex items-center mb-2">
        <Typography className="font-bold text-lg mr-2 text-[14px]">👤</Typography>
        <Typography className="font-semibold text-base font-poppins" style={{ color: '#212529', fontSize: '12px' }}>
          Attachment
        </Typography>
      </div>

      <div
        {...getRootProps({
          className:
            "dropzone border border-blue-gray-200 rounded-lg p-4 flex flex justify-center gap-2 items-center cursor-pointer h-10",
        })}
      >
        <input {...getInputProps()} />
        <div className="text-blue-gray-300 text-lg">
          <ArrowUpTrayIcon className="h-4 w-4" />
        </div>
        <p className="text-blue-gray-300 text-[10px] font-normal font-poppins">
          Drag & Drop or Click to Select Files
        </p>
      </div>

      {filesEvent[type].length > 0 && (
        <div className="mt-4">
          <div className="flex flex-col gap-2">
            {filesEvent[type].map((file, index) => (
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
  );
};

export default MultipleUpload;
