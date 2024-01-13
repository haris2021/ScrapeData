import mongoose from "mongoose";

import ScriptDataSchema from "../../controllers/scriptData/scriptData-schema.js";

const ScriptDataModel = mongoose.model("ScriptDataModel", ScriptDataSchema);

export default ScriptDataModel;
