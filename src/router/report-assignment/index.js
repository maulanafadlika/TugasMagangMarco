const express = require("express");
const router = express.Router();
const { ReportAssignmentModule } = require("../../modules");
const middleware = require("../../middleware");

const { MODE } = require("../../config/env");
const decryptionMiddleware = MODE === "development" ? [] : [middleware.use("decryption")];

router.get(
    "/api/v1/report-assignment/:project",
    [
        middleware.use("auth"),
    ],
    ReportAssignmentModule.getReportAssigmentProject
);

router.post(
  "/api/v1/get-status",
  [
    middleware.use("auth"),
    ...decryptionMiddleware,
    middleware.use("modeChecker"),
    middleware.use("validator.dataStatus"),
  ],
  ReportAssignmentModule.getDataStatusProject
);



module.exports = router;
