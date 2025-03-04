const mongoose = require('mongoose')

const packageSchema = new mongoose.Schema({
title:{
    type:String,
    required:true
},
description:{
    type:String,
    required:true
},
price:{
    type:String,
    required:true
},
startDate:{
    type:Date,
    requierd:true
},
endDate:{
    type:Date,
    requierd:true
},
addDeals:{
    type:Number,
    required:true
},
status:{
    type:String,
    enum:['active','Inactive'],
    default:'active'
},
},{timestamps:true});
const packages = mongoose.model('Packages',packageSchema);
module.exports=packages;