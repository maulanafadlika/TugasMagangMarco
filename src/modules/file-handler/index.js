const { ResponseHandler, logger, CustomError } = require("../../utils");
const fs = require("fs");
const path = require("path");
const { uploadMultiple } = require("../../utils/multer");
const multer = require("multer");

class FileHandlerModule {
  static async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return next(new CustomError("upload failed, object file is null", 400))
      }
      const dataResponse = {
        filename: req.file.filename,
      };
      return ResponseHandler.success(req, res, "success upload file", dataResponse, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async multipleUploadFile(req, res, next) {
    try {
      let files = req.files;
      if (files.length === 0) {
        return next(new CustomError("upload failed, object file is null", 400))
      }
      const dataResponse = {
        filename: files.map((item) => {
          return item.filename;
        }),
      };
      return ResponseHandler.success(req, res, "success uploads any files", dataResponse, 200);
    } catch (error) {
      return next(error);
    }
  }

  static async updateFile(req, res, next) {
    try {
      let { oldFile } = req.body;
      console.log('oldFile raw:', oldFile);
  
      // Pastikan oldFile jadi array jika string
      if (typeof oldFile === 'string') {
        try {
          oldFile = JSON.parse(oldFile);
        } catch {
          oldFile = [oldFile];
        }
      }
  
      // Pastikan oldFile adalah array
      oldFile = Array.isArray(oldFile) ? oldFile : [oldFile];
  
      // Jika oldFile ada, hapus file lama
      for (const fileName of oldFile) {
        if (fileName && fileName !== '') {
          const filePath = path.join(__dirname, "../../storage", "public", "attachments", fileName);
          fs.unlink(filePath, (err) => {
            if (err) {
              logger.info(`[INFO]: file not found -> ${fileName}`);
            } else {
              logger.info(`[INFO]: file deleted -> ${fileName}`);
            }
          });
        }
      }
  
      // Ambil file yang baru diupload
      const uploadedFiles = req.files?.map(file => file.filename) || [];
  
      // Filter oldFile untuk hanya menyimpan yang tidak kosong
      const validOldFiles = oldFile.filter(fileName => fileName && fileName !== '');
      
      // Gabungkan valid oldFile dan uploadedFiles
      const fileNames = validOldFiles.length > 0 ? [...validOldFiles, ...uploadedFiles] : uploadedFiles;
  
      const dataResponse = {
        filename: fileNames,
      };
      console.log('uploadedFile', dataResponse);
      
      return ResponseHandler.success(req, res, "success update file", dataResponse, 200);
    } catch (error) {
      return next(error);
    }
  }
  
  
  static async downloadFile(req, res, next) {
    try {
      const filename = req.params.filename;
      const filepath = path.join(__dirname, "../../storage", "public", "attachments", filename);
      res.download(filepath, filename, (err) => {
        if (err) {
          return next(err);
        }
        console.log("[INFO]: file downloaded");
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = FileHandlerModule;
