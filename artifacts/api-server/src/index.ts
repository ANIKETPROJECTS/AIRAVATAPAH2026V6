import app from "./app";
import { logger } from "./lib/logger";
import { connectMongo } from "./lib/mongo";
import { seedSchemes } from "./lib/seed-schemes";
import { seedInsuranceSubsidies } from "./lib/seed-insurance-subsidies";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

connectMongo()
  .then(async (db) => {
    await seedSchemes(db);
    await seedInsuranceSubsidies(db);
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Failed to connect to MongoDB");
    process.exit(1);
  });
