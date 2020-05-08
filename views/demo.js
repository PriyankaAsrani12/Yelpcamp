var express=require("express")
var app=express()
var mysql=require("mysql")

var connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"demo",
});

connection.connect(function(err){
    if(err){
        console.log("Error")
    }else{
        console.log("Connected")
    }
});

app.get("/",function(req,res){
    connection.query("SELECT * FROM demo WHERE id<2",function(err,rows,field){
        if(err){
            console.log("ERROR query")
        }else{
            console.log("Successful query")
            console.log(rows)
            res.send("hello" + rows[0].id)
        }
    })
})

app.listen(1337,function(){
    console.log("server started")
})
