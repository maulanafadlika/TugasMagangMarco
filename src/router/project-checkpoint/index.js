const express = require("express");
const router = express.Router();

const middleware = require("../../middleware");

const { MODE } = require("../../config/env");
const { ProjectCheckpointModule } = require("../../modules");
const decryptionMiddleware = MODE === "development" ? [] : [middleware.use("decryption")];

router.get(
    "/api/v1/project-checkpoint/:project",
    [
        middleware.use("auth"),
    ],
    ProjectCheckpointModule.getDataCheckpoint
);

router.put(
    "/api/v1/project-checkpoint",
  [
    middleware.use("auth"),
    ...decryptionMiddleware,
    middleware.use("modeChecker")
  ],
    ProjectCheckpointModule.update
);



module.exports = router;
