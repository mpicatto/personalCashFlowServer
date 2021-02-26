//----------------------------imports--------------------------------------------//
const moment =require('moment');
const server = require('express').Router();
const { Transactions, User,Categories } = require('../db.js');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;

//-----------------------------get routes--------------------------------------------//
server.get('/:email/:from/:to/:type',getuser, getMoves)

async function getuser(req,res,next){
    let userId

    await User.findAll({
        where:{email:req.params.email}
    })
    .then(user=>{
        userId=user[0].dataValues.id     
    })
    .catch(err=>{
        res.send("No se encuentra el Usuario")
        return
    })
    req.userId = userId

    next()
}

async function getMoves(req,res,next){
    let from = req.params.from
    let to = req.params.to
    let type = [req.params.type]
    let data=[]


    if(req.params.type==="todas"){
        type=["ingreso", "egreso"]
    }

    await Transactions.findAll({
        order:[['date', 'DESC']],
        where:{
            date:{[Op.between]:[from,to]},
            type:type
        }
    })
    .then(moves=>{
        if (moves){
            let movement={}
            moves.map(move=>{
                movement={}
                movement.id =move.dataValues.id
                movement.date=move.dataValues.date
                movement.categoryId=move.dataValues.categoryId
                movement.amount=move.dataValues.amount
                movement.type=move.dataValues.type
                movement.concept=move.dataValues.concept
                data.push(movement)
            })
        }else{
            res.send("No se encuentran resultados")
        }  
    })
    .catch(err=>{
        res.sendStatus(400)
    })
    console.log(data.length)
    res.send(data)
}

module.exports = server;