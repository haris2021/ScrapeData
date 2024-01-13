import mongoose from "mongoose";
import { startServer } from "../verification/ScriptLogic/script.js";

import AddScriptData from "./controllers/scriptData/scriptData-controller.js";

const CONNECTION_STRING =
  "mongodb+srv://tmt:tmt2023@tmt.bozzsw0.mongodb.net/?retryWrites=true&w=majority";

try {
  mongoose
    .connect(CONNECTION_STRING)
    .then(() => console.log("Database Connected"));
} catch (err) {
  console.log(err.message);
  //Exit process with failure
  process.exit(1);
}

const serverEvents = startServer();

serverEvents.once("dataRetrieved", (data) => {
  // You can now use the data here
  console.log("Data retrieved: from app.js", data);
  backend(data);
});

async function backend(data) {
  try {
    console.log("Prining data inside backend", data);
    const result = await AddScriptData(data);
    console.log("AddScriptData result:", result);
  } catch (error) {
    console.error("Error calling AddScriptData:", error);
  }
}
