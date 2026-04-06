const Joi = require("joi");

const createDataStatusObjects = {
    status_id: Joi.string().required().messages({
        "string.base": "status_id value must be a string",
        "any.required": "status_id field is required",
        "string.empty": "status_id field value cannot be empty",
    }),
    project_id: Joi.string().required().messages({
        "string.base": "project_id value must be a string",
        "any.required": "project_id field is required",
        "string.empty": "project_id field value cannot be empty",
    })
};



module.exports = {
   createDataStatusObjects
};