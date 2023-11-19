// const Api = require("./lib/RestApi");
// let { authparams } = require("./cred");
// let api = new Api({});
// api.login(authparams)
// .then((res) => {        
//         console.log('Login Response: ', res);
//         api.get_positions().then((res) => {
//             console.log('Position Book', res);
//             return;
//         }).catch((err) => {
//             console.error(err);
//         });
//         return;
//     }).catch((err) => {
//         console.error(err);
//     });
import express from "express";
import morgan from "morgan";
import cors from "cors";
import routes from "./service/index.js";
// set up dotenv
import dotenv from "dotenv";
import { logRequest, logResponse } from "./utils.js";
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
// start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
