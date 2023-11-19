import winston, {format} from "winston";
import dotenv from "dotenv";
dotenv.config(); 

function initializeLogger() {
    const defaultFormat = format.combine(winston.format.json(), format.colorize())
    const logger = winston.createLogger({
        format: defaultFormat,
      });

      console.log("NODE_ENV: ", process.env.NODE_ENV);
      
      if (process.env.NODE_ENV == "production") {
          logger.level = "info";
          logger.add(new winston.transports.Http({
              host: "log-api.eu.newrelic.com",
              port: 443,
              path: "/log/v1?Api-Key=eu01xx114702cd59b0498e72766d07b665ceNRAL",
              ssl: true,
              batch: true,
              batchInterval: 5000,
              batchCount: 10
          }))
          logger.add(new winston.transports.Console({
              format: defaultFormat,
          }));
      }
      else {
          logger.level = "debug";
          logger.add(new winston.transports.Console({
              format: defaultFormat,
          }));
      }
      return logger;
}

const logger = initializeLogger();

export default logger;
