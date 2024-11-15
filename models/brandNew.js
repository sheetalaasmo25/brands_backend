const mongoose = require('mongoose')
const brandsNew = new mongoose.Schema({
    name:{
        type:String,
        requierd:true
    },
    image:{
        type:String,
        requierd:true
    }
},{timestamps:true});

const BrandsNew= mongoose.model('BrandsNew',brandsNew)
module.exports=BrandsNew;