const authenticationRoutes = require("./authentication");
const usersRoutes = require("./user");
const groupsRoutes = require("./group");
const menusRoutes = require("./menu");
const projectsRoutes = require("./project");
const parametersRoutes = require("./parameter");
const statusRoutes = require("./status");
const projectStatusRoutes = require("./project-status");
const tasklistRoutes = require("./task");
const subtasklistRoutes = require("./subtask");
const fileHandlerRoutes = require("./file-handler");
const projectAssigneeRoutes = require("./project-assignee");
const commentsRoutes = require("./comment");
const testingRoutes = require("./testing");
const summaryRoutes = require("./summary");
const reportProjectRoutes = require("./report-timeframe-project");
const reportRewriteTask = require("./report-rewrite-task");
const purchaseOrderRoutes = require("./purchase-order");
const customerRoutes = require("./customer");
const activityLogRoutes = require("./activity-log");
const reportKpiRoutes = require("./report-user-task");
const reportActivity = require("./report-activity");
const docsStandardRoutes = require("./docs-standard");
const errorHandler = require("../middleware/errors");
const GoogleAuthRoutes = require('./google-auth');
const reportAssignmentRoutes = require('./report-assignment')
const projectCheckpoint = require('./project-checkpoint')
const blastRoutes = require('./blast')
const forecastPrincipalRoutes = require('./forecast-principle')

const { GOOGLE_OAUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CALLBACK_URL, GOOGLE_ACCESS_TOKEN_URL, GOOGLE_TOKEN_INFO_URL } = require("../config/env");
const fetch = require('node-fetch');

module.exports = (app) => {
  try {
    // Tambahkan prefix "/pmapi" ke semua rute
    app.use("/pmapi", (req, res, next) => {
      next();
    });

    // Testing Routes
    app.get("/pmapi", async (req, res) => {
      return res.status(200).json({
        status: "success",
        message: "API service is run properly",
      });
    });

    // Authentication Routes
    app.use("/pmapi", authenticationRoutes);

    // Google Auth Routes
    app.use("/pmapi", GoogleAuthRoutes);

    // Users Routes
    app.use("/pmapi", usersRoutes);

    // Groups Routes
    app.use("/pmapi", groupsRoutes);

    // Menus Routes
    app.use("/pmapi", menusRoutes);

    // Projects Routes
    app.use("/pmapi", projectsRoutes);

    // Parameters Routes
    app.use("/pmapi", parametersRoutes);

    // Status Routes
    app.use("/pmapi", statusRoutes);

    // Project Status Routes
    app.use("/pmapi", projectStatusRoutes);

    // Tasklist Routes
    app.use("/pmapi", tasklistRoutes);

    // Subtasklist Routes
    app.use("/pmapi", subtasklistRoutes);

    // File Handling Routes
    app.use("/pmapi", fileHandlerRoutes);

    // Project Assignee Routes
    app.use("/pmapi", projectAssigneeRoutes);

    // Comments Routes
    app.use("/pmapi", commentsRoutes);

    // Testing Routes
    app.use("/pmapi", testingRoutes);

    // Summary Routes
    app.use("/pmapi", summaryRoutes);

    // Report Timeframe Project Routes
    app.use("/pmapi", reportProjectRoutes);

    // Report Rewrite Task Routes
    app.use("/pmapi", reportRewriteTask);

    // Purchase Order Routes
    app.use("/pmapi", purchaseOrderRoutes);

    // Customer Routes
    app.use("/pmapi", customerRoutes);

    // Activity Log Routes
    app.use("/pmapi", activityLogRoutes);

    // Report KPI Routes
    app.use("/pmapi", reportKpiRoutes);

    // Report Activity Routes
    app.use("/pmapi", reportActivity);

    // Docs Standard Routes
    app.use("/pmapi", docsStandardRoutes);

    // Report Assignment Routes
    app.use("/pmapi", reportAssignmentRoutes);

    // Report Assignment Routes
    app.use("/pmapi",projectCheckpoint);

    // Report Assignment Routes
    app.use("/pmapi",forecastPrincipalRoutes);

    // Blast Routes
    app.use("/pmapi",blastRoutes);

    // Middleware error handler
    app.use(errorHandler);

    // Handle unknown routing (404)
    app.get("*", (req, res) => {
      res.status(404).json({
        status: "error",
        message: "Route not found",
      });
    });
  } catch (error) {
    console.log("[INFO-SERVER]: Server error => ", error);
  }
};