// Function to read the JSON file
import { randomUUID } from "crypto";
import logger from "./logger.js";
import fs from "fs/promises"


// function to read the JSON file
export const readJSONFile = async (filePath) => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(data);
      return jsonData;
    } catch (error) {
      logger.error("Error reading JSON file: ", error, filePath);
      return null;
    }
  };





// function to log every request
export function logRequest(req, res, next) {
    var requestId = req.headers["x-request-id"]
    logger.info({"Request Id": requestId, "API Request": req.url, "Method": req.method, "Body": req.body, "Headers": req.headers, "Params": req.params, "Query": req.query});
    next();
}

// function to log every response
export function logResponse(req, res, next) {
  var requestId = req.headers["x-request-id"]
  logger.info({"Request Id": requestId, "API Request": req.url, "Method": req.method, "Body": req.body, "Params": req.params, "Query": req.query, "Response Code": res.statusCode });
  res.end()
}