//----------------------------imports--------------------------------------------//
const moment =require('moment');
const server = require('express').Router();
const { Transactions, User,Categories } = require('../db.js');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;

//-----------------------------get routes--------------------------------------------//



//---------------get current balance + last 5 moves------------------ 
server.get('/balance/:email/:last', getuser, getCategories, currentBalance,past5balances,getLast5movs  );

async function getuser(req,res,next){
    let data={currentBalance:{},movements:[], categories:[]}
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
    req.data = data

    next()
  
}

async function getCategories(req,res,next){
    
    let categoryList=[]
    await Categories.findAll({})
    .then(category=>{
        category.map(item=>{
            categoryList.push(item.dataValues)
        })
    })
    .catch(err=>{
        res.send("No se encuentran las categorias")
        return
    })
   
    req.data.categories=categoryList
    next()
}

async function currentBalance(req,res,next){
    let pastBalance
    let pastBalanceDate
    let today = moment().format("YYYY-MM-DD")
    let expenses
    
    await Transactions.findAll({
        limit:1,
        order:[['date', 'DESC']],
        where:{
            userId:req.userId,
            type:["saldo"]
        }
    })
    .then(transaction=>{
        if (transaction){
            pastBalance = parseFloat(transaction[0].dataValues.amount)
            pastBalanceDate = transaction[0].dataValues.date
        }else{
        }
    })
    .catch(err=>{
        console.log("error")
        return
    })

    await Transactions.findAll({
        order:[['date', 'DESC']],
        where:{
            date:{[Op.between]:[pastBalanceDate,today]},
            type:["egreso"]
        }
    })
    .then(egresos =>{
        expenses=0
        if (egresos){
            egresos.map(item=>{
                if(item.dataValues.date!=pastBalanceDate)
            expenses=expenses+parseFloat(item.dataValues.amount)
          })
        }
    })
    if (pastBalance===undefined){
        res.send({currentBalance:{balance:0},
        categories:req.data.categories})
    }else{
        req.data.currentBalance.balance  = pastBalance - expenses
        req.data.currentBalance.pastBalanceDate = pastBalanceDate
        next()
    }

}

 async function past5balances(req,res,next){
    let last30Moves=[]
    let dailyMoves=[]
    let dailyBalance=[]
    let currentBalance=req.data.currentBalance.balance
    let i=0
    let j=0 

    await Transactions.findAll({
        limit:30,
        order:[['date', 'DESC']],
        where:{
            userId:req.userId,
            type:["egreso","ingreso"]
        }
    })
    .then(transaction=>{
        transaction.map(item=>{
            last30Moves.push(item.dataValues)
        }) 
    })
    .catch(err=>{
        res.send("No se encuentran los movimientos")
        return
    })

    
    do {
        if(last30Moves[i]){
            let moves={}
            const setMove =()=>{
                if (last30Moves[i].type==="egreso"){
                    moves.amount=parseFloat(last30Moves[i].amount ) 
                }else{
                    moves.amount=parseFloat(last30Moves[i].amount)
                    moves.amount=moves.amount-(moves.amount*2)
                }
            }
            moves.date=last30Moves[i].date
            dailyMoves.push(moves)
            
            setMove()

            i=i+1
            
            if (last30Moves[i]){
                while(dailyMoves[j].date===last30Moves[i].date){
                    if (last30Moves[i].type==="egreso"){
                        dailyMoves[j].amount=parseFloat(dailyMoves[j].amount)+parseFloat(last30Moves[i].amount)
                    }else{
                        dailyMoves[j].amount=parseFloat(dailyMoves[j].amount)-parseFloat(last30Moves[i].amount)
                    }            
                    i=i+1
                }
            }else{
                dailyMoves.push(false)
            }
            dailyMoves[j].amount=dailyMoves[j].amount.toString()
            j=j+1 
        }else{
            dailyMoves.push(false)
        }
             
      } while (dailyMoves.length < 5)

    i=0
    do {
         if(dailyMoves[i]){
            let balance={}
            balance.balance=currentBalance
            balance.date=dailyMoves[i].date
            dailyBalance.push(balance)
            currentBalance=currentBalance+parseFloat(dailyMoves[i].amount)
            i=i+1}else{
                dailyBalance.push(false)
            }
    }
    while(dailyBalance.length<5)
    req.data.dailyBalance=dailyBalance
    console.log(dailyBalance)
    next()
 }

async function getLast5movs(req,res){
    
    let last=parseInt((req.params.last))
    let movementList=[]

    await Transactions.findAll({
        limit:last,
        order:[['date', 'DESC']],
        where:{
            userId:req.userId,
            type:["egreso","ingreso"]
        }
    })
    .then(transaction=>{
        let movement={}

        transaction.map(transaction=>{
            movement ={}
            movement.id = transaction.dataValues.id
            movement.date=transaction.dataValues.date
            movement.categoryId=transaction.dataValues.categoryId
            movement.amount=transaction.dataValues.amount
            movement.type=transaction.dataValues.type
            movement.concept=transaction.dataValues.concept
            movementList.push(movement)
        })     
    })
    .catch(err=>{
        res.send("No se encuentran los movimientos")
        return
    })
    req.data.movements=movementList
    res.send(req.data)
}

//-----------------------Save New Expenses Transactions---------------------------------------
 
server.post("/new_egreso/:email",getuser, saveData,ifLastExpenseChecker)

async function saveData(req,res,next){
    let{date,type,categoryId,concept,amount} = req.body
    let userId = req.userId

    await Transactions.create({
        userId,
        type,
        categoryId,
        concept,
        amount,
        date
    })
    .then(transaction=>{
                next()
    })
    .catch(err=>{
        res.sendStatus(400)
    })
}

async function ifLastExpenseChecker(req,res,next){

    let date=req.body.date
    let today = moment().format("YYYY-MM-DD")
    let nextBalances=[]

    await Transactions.findAll({
        order:[['date', 'ASC']],
        where:{
            userId:req.userId,
            date:{[Op.between]:[date,today]},
            type:["saldo"]
        }
    })
    .then(transaction=>{
        transaction.map(item=>{
            nextBalances.push(item.dataValues)
        })

    })
    .catch(err=>{
        res.sendStatus(400)
    })

    if (nextBalances.length===0){
        res.sendStatus(200)
    }else{
        nextBalances.map(saldo=>{
            let newSaldo = ""
            saldo.amount=parseFloat(saldo.amount) - parseFloat(req.body.amount)
            newSaldo=saldo.amount.toString()
           Transactions.findByPk(saldo.id)
           .then(saldo=>{
               saldo.amount=newSaldo
               saldo.save()
           })
           .catch(err=>{
               res.sendStatus(400)
           })
        })
        res.sendStatus(200)
    }
   
}

//-----------------------Save New Income Transactions---------------------------------------
 
server.post("/new_ingreso/:email",getuser, saveData,ifLastIncomeChecker,newBalance)

async function ifLastIncomeChecker(req,res,next){
    let userId = req.userId
    let date=req.body.date
    let today = moment().format("YYYY-MM-DD")
    let nextBalances=[]
    req.ifPost=false
    

    await Transactions.findAll({
        order:[['date', 'ASC']],
        where:{
            userId:req.userId,
            date:{[Op.between]:[date,today]},
            type:["saldo"]
        }
    })
    .then(transaction=>{
        transaction.map(item=>{
            nextBalances.push(item.dataValues)
        })

    })
    .catch(err=>{
        res.sendStatus(400)
    })

    if (nextBalances.length===0){
        next()
    }else{
        nextBalances.map(saldo=>{
            saldo.amount=parseFloat(saldo.amount) + parseFloat(req.body.amount)
            newSaldo=saldo.amount.toString()
           Transactions.findByPk(saldo.id)
           .then(saldo=>{
               saldo.amount=newSaldo
               saldo.save()
           })
           .catch(err=>{
               res.sendStatus(400)
           })
        })
        req.nextBalances=nextBalances
        req.ifPost=true
        next()

    }
   
}

async function newBalance(req,res){
    let date = req.body.date    

    let lastYearDate=""
    let userId = req.userId
    let newBalance=0
    let pastBalance=0
    let pastBalanceDate=''

    function pastYear(date){
        let prevYear=parseInt(date.split('-')[0]) -1
        lastYearDate=date.split('-')
        lastYearDate[0]=prevYear.toString()
    }

    if(req.ifPost===false){
        newBalance = parseFloat(req.body.amount) + req.body.balance
    }else{
        pastYear(date)
        await Transactions.findAll({
            limit:1,
            order:[['date', 'DESC']],
            where:{
                userId:req.userId,
                date:{[Op.between]:[lastYearDate,date]},
                type:["saldo"]
            }
        })
        .then(transaction=>{
            if (transaction)
            console.log(transaction[0].dataValues)
            pastBalance = parseFloat(transaction[0].dataValues.amount)
            pastBalanceDate = transaction[0].dataValues.date
        })
        .catch(err=>{
            res.send("No se encuentran movimientos")
            return
        })

        await Transactions.findAll({
            order:[['date', 'DESC']],
            where:{
                date:{[Op.between]:[pastBalanceDate,date]},
                type:["egreso"]
            }
        })
        .then(egresos =>{
            expenses=0
            if (egresos){
                egresos.map(item=>{
                expenses=expenses+parseFloat(item.dataValues.amount)
              })
            }
        })

        newBalance = pastBalance + parseFloat(req.body.amount) - expenses


    }

    await Transactions.create({
        userId:userId,
        type:"saldo",
        categoryId:"15",
        concept:"saldo",
        amount:newBalance,
        date:date
    })
    .then(balance=>{
        if (balance){
            res.sendStatus(200)
        }
    })
    .catch(err=>{
        res.sendStatus(400)
    })
}



module.exports = server;