import React, { useState } from 'react';
import { Typography } from "@material-tailwind/react";
import { AiOutlineDownload, AiOutlineFullscreen, AiOutlineFullscreenExit } from 'react-icons/ai';
import { handleDownload } from '@/utils/helper';

const PreviewModal = ({ showModal, file, closeModal }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  // console.log('test url',`${import.meta.env.VITE_BASE_URL}/attachments/${file}`)
  if (!showModal) return null;

  const extension = file.split('.').pop().toLowerCase();
  let fileContent;

  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
      fileContent = (
        <div className="flex justify-center items-center">
          <img src={`${import.meta.env.VITE_BASE_URL}/attachments/${file}`} alt="attachment preview" className="max-w-full max-h-[75vh] object-contain" />
        </div>
      );
      break;
    case 'pdf':
      fileContent = <iframe src={`${import.meta.env.VITE_BASE_URL}/attachments/${file}`} className="w-full h-[75vh]" />;
      break;
    case 'mp4':
    case 'avi':
      fileContent = <video src={`${import.meta.env.VITE_BASE_URL}/attachments/${file}`} controls className="max-w-full max-h-[75vh] object-contain" />;
      break;
    default:
      fileContent = <Typography className="font-normal text-xs font-poppins px-8">Unsupported file type</Typography>;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className={`${isFullScreen ? 'w-full h-full' : 'w-11/12 md:w-4/5 lg:w-2/3'} bg-white p-4 rounded-lg relative overflow-auto`}>
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-4 px-2">
          <button
            onClick={() => handleDownload(file)}
            className="flex items-center text-blue-500 hover:text-blue-700 text-xs font-medium font-poppins"
          >
            <AiOutlineDownload className="h-4 w-4 mr-1" />
            Download
          </button>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center text-gray-600 hover:text-black text-xs font-medium font-poppins"
          >
            {isFullScreen ? (
              <>
                <AiOutlineFullscreenExit className="h-4 w-4 mr-1" />
                Exit Full Screen
              </>
            ) : (
              <>
                <AiOutlineFullscreen className="h-4 w-4 mr-1" />
                Full Screen
              </>
            )}
          </button>
        </div>

        {/* File Content */}
        <div className="mt-4 mb-4">{fileContent}</div>
      </div>
    </div>
  );
};

export default PreviewModal;
