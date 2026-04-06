const express = require("express");
const router = express.Router();

const middleware = require("../../middleware");

const { MODE } = require("../../config/env");
const { BlastModule } = require("../../modules");
const decryptionMiddleware = MODE === "development" ? [] : [middleware.use("decryption")];

router.get(
    "/api/v1/data-blast",
    BlastModule.blastAction
);

router.post(
    "/api/v1/blast",
    BlastModule.update
);



module.exports = router;
