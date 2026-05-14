import app from "./app";
import { logger } from "./lib/logger";
import { connectMongo } from "./lib/mongo";
import { seedSchemes } from "./lib/seed-schemes";
import { seedInsuranceSubsidies } from "./lib/seed-insurance-subsidies";
import { type Db } from "mongodb";

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

async function migrateFarmerIds(db: Db): Promise<void> {
  const col = db.collection("farmers");
  const oldFarmers = await col.find({ farmerId: { $regex: /^F-\d+$/ } }).toArray();
  if (oldFarmers.length === 0) return;
  const usedIds = new Set<string>(
    (await col.find({}, { projection: { farmerId: 1 } }).toArray())
      .map((f) => String(f["farmerId"] ?? ""))
      .filter((id) => !/^F-\d+$/.test(id))
  );
  for (const farmer of oldFarmers) {
    const oldId = String(farmer["farmerId"] ?? "");
    const addedAt = farmer["addedAt"] ? new Date(farmer["addedAt"] as string) : new Date();
    const yy = addedAt.getFullYear();
    const mm = String(addedAt.getMonth() + 1).padStart(2, "0");
    const dd = String(addedAt.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;
    let seq = 1;
    let newId = `F${dateStr}${String(seq).padStart(2, "0")}`;
    while (usedIds.has(newId)) { seq++; newId = `F${dateStr}${String(seq).padStart(2, "0")}`; }
    usedIds.add(newId);
    await col.updateOne({ farmerId: oldId }, { $set: { farmerId: newId } });
    await db.collection("grievances").updateMany({ farmerId: oldId }, { $set: { farmerId: newId } });
    await db.collection("applications").updateMany({ farmerId: oldId }, { $set: { farmerId: newId } });
    logger.info({ oldId, newId }, "Migrated farmer ID");
  }
  logger.info({ count: oldFarmers.length }, "Farmer ID migration complete");
}

connectMongo()
  .then(async (db) => {
    await seedSchemes(db);
    await seedInsuranceSubsidies(db);
    await migrateFarmerIds(db);
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
