import ScriptDataModel from "./scriptData-model.js";

const AddScriptDataDAO = async (event) => {
  console.log("Inside DAO" + event);
  return await ScriptDataModel.create(event);
};

export default AddScriptDataDAO;
