const mongoose =require('mongoose');

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role:{
        type:String,
        enum:['Buyer','Seller','Admin','buyer','seller','admin'], // allow all casings
        default:'Buyer'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports=mongoose.model('User',userSchema);