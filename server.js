const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')
const cors = require('cors');

const rounds = 12;

// const config = require('./config')


app.use(cors());

app.use(bodyParser.json());

const pool = mysql.createPool({
    host:"localhost",
    user:"root",
    password:"pass1234",
    database:"accredian",
    connectionLimit:10
});

pool.getConnection((err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("success")
    }
})



app.get('/',(req, res)=>{
    pool.query("SELECT * FROM users",(err,result)=>{
        if(err){
            res.send("something went wrong")
        }else{
            res.send(result)
        }
    })
})

app.get('/users',(req, res)=>{
    const username = req.query.username;
    console.log(username)
    // const{ id } = req.query
    // console.log(id)
    pool.query("select * FROM users where username=?",username,(err, result)=>{
        if(err){
            console.log(err)
            res.send(err)
        }else{
            res.send(result);
        }
    })
})

app.post("/userlogin",(req, res)=>{
    const{username, pwd} = req.body;
    const stmt = "select username, pwd from users where username=?"

    pool.query(stmt,username,(err, data)=>{
        if(err) return res.send({Error:"failed to connect"})
        if(data[0]){
            console.log(data[0])
            bcrypt.compare(pwd,data[0].pwd,(err, result)=>{
                if(err){
                    console.log("login failed")
                    return res.send({Error:"wrong password"})

                }else if(result){
                    console.log(result)
                    res.json({status:200, sc:"successful"})
                    console.log("login successful")
                }else{
                    console.log("failed to login")
                    res.send("wrong at server site")
                }
            })
        }else{
            return res.send("Credential not matched")
        }
    })
})


app.use((req,res,next)=>{
    const {username, email} = req.body

    console.log("use",username,email)

    const stmt = 'Select username, email from users where username=? or email=?'
    pool.query(stmt,[username, email],(err, result)=>{
            console.log(result)
            if(result[0]){
                if(result[0].username==username){
                    console.log('already register')
                    return res.json({Error: "username has taken"})
                }else{
                    return res.json({Error: "Email already register"})
                }
               
               
            }else if(err){
                return console.log("register query error")
            }else{
                next();   
            }
        }
    )
})

app.post("/create",(req, res)=>{
    const {username,pwd, email} = req.body;
    console.log(pwd)
    console.log(username,pwd, email)
    const stmt = "INSERT INTO users(username, pwd, email) VALUES(?, ?, ?);"

    bcrypt.hash(pwd,rounds,(err,hash)=>{
        if(err){
            return res.json({Error: "Password hashing failed"})
        }

        pool.query(stmt,[username,hash, email],(err,result)=>{
            if(err){
                return res.json({Error: "Inserting data error in server"})
            }else if(result){
                return res.json({status:"Success"})
            }else{
                return res.json({Error:"Not registered"})
            }
        })

    })

   
})




app.listen(port,()=>{
    console.log("server is listening at port :", port)
})