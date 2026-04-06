const express = require("express");
const router = express.Router();
const { ForecastPrincipalModule } = require("../../modules");
const middleware = require("../../middleware");

const { MODE } = require("../../config/env");
const decryptionMiddleware = MODE === "development" ? [] : [middleware.use("decryption")];

router.post(
  "/api/v1/forecast-principal/store",
  [
    middleware.use("auth"),
    ...decryptionMiddleware,
    middleware.use("modeChecker"),
    // middleware.use("validator.createPurchaseOrder")
  ],
  ForecastPrincipalModule.store
);

router.get("/api/v1/forecast-principal", [middleware.use('auth')], ForecastPrincipalModule.getAll)

router.get("/api/v1/forecast-principal/parameters", [middleware.use('auth')], ForecastPrincipalModule.getForecastParams)

router.get("/api/v1/forecast-principal/report-revenue", [middleware.use('auth')], ForecastPrincipalModule.getReportRevenue)

router.delete("/api/v1/forecast-principal/:fr_id/delete", [middleware.use('auth')], ForecastPrincipalModule.delete)


router.put(
  "/api/v1/forecast-principal/:fr_id/edit",
  [
    middleware.use("auth"),
    ...decryptionMiddleware,
    middleware.use("modeChecker")
  ],
  ForecastPrincipalModule.update
);

module.exports = router;
