import mongoose from "mongoose";

const Schema = mongoose.Schema(
  {
    Eventqrcode: { type: String },
    Eventname: { type: String },
    Eventprice: { type: Number },
    EventNoofticket: { type: Number },
    Eventcategory: { type: String },
    Fromaddress: { type: String },
    Originaddress: { type: String },
    Isverified: { type: Boolean },
  },
  { collection: "ScriptData" }
);

export default Schema;
