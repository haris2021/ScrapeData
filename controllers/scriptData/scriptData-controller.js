import AddScriptDataDAO from "./scriptData-DAO.js";

const AddScriptData = async (scriptdata) => {
  console.log("Inside controller", scriptdata);
  const AddedData = await AddScriptDataDAO(scriptdata);
  console.log("Printing return data", AddedData);
  return AddedData;
};

export default AddScriptData;

// need to add API calls to fetch inidivual information.
