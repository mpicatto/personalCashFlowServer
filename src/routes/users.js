//----------------------------imports--------------------------------------------//
const server = require('express').Router();
const { Transaction, User, } = require('../db');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
const  { bcrypt, hash } = require( 'bcryptjs');


//-----------------------------routes--------------------------------------------//
//----------Save New User--------------------//
server.post('/',async(req,res)=>{
 
    let {
      email,
      password,
      name,
      lastName,
   } = req.body;

   let usedMail = false 

   await User.findAll({
    where:{email:email}
  })
  .then(user=>{
    if(user.length>0){
      console.log(user)
      usedMail=true}
    })
  console.log(usedMail)

  if(usedMail==true){
    res.send("used")
    return
  }else{
   password = await hash(password,10);
   console.log(password)
        User.create({
          email,
          password,
          name,
          lastName,
        })
        .then(user=>{
            return res.send('ok');
        })
        .catch(err=>{
            res.sendStatus(500)
        })
    // }
  }  
  });
module.exports = server;