import express from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./service/index.js";
import cron from 'node-cron';
// set up dotenv
import dotenv from "dotenv";
import { logRequest, logResponse } from "./utils.js";
import { cleanupStrategyData } from "./service/clearStrategyData.js";
dotenv.config();
// create express app
const app = express();
const port = process.env.PORT || 3000;
// set up body parser middleware
app.use(express.json());
// set up morgan middleware
app.use(morgan("dev"));
// set up cors middleware
app.use(cors());
// set up routes
app.use(logRequest, routes, logResponse);
// // set up logger middleware for response
// app.use(logResponse);
// setInterval(DailyGoalStrategyExecution, 3000);
// Schedule the function to run at 12 AM IST (4:30 PM UTC)
cron.schedule('0 0 * * *', () => {
    // Run the function
    cleanupStrategyData();
}, {
    timezone: 'Asia/Kolkata' // Set the timezone to IST
});
// start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
