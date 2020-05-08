var express=require("express")
var router=express.Router()
var mysql=require("mysql")
var connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"root",
    database:"demo",
});
connection.connect(function(err){
    if(err){
        console.log("Error in connection!")
    }else{
        console.log("Connected with MySQL!")
    }
});
//FUNCTION TO CREATE NEW CAMPGROUND IN DB
function create(name,image,desc){
    connection.query("INSERT INTO yelpcamp(Name,ImageURL,Description) VALUES(?,?,?)",[name,image,desc],function(err,rows,field){
        if(err){
            console.log("Not stored in DB. Some ERROR!")
        }else{
            console.log("Successfully stored in DB!")
        }
    });
};

//FUNCTION TO STORE NEW COMMENT IN DB
function createComment(userid,comment,author){
    connection.query("INSERT INTO comments(UserId,comments,author) VALUES(?,?,?)",[userid,comment,author],function(err,rows,field){
        if(err){
            console.log("Error in inserting comment in DB")
        }else{
            console.log("Comment successfully inserted!")
        }
    });
};

//INDEX ROUTE
router.get("/",function(req,res){
    res.render("landing")
});

router.get("/campgrounds",function(req,res){
    // Get all the campgrounds from the DB
    connection.query("SELECT * FROM auth WHERE status='login'",function(err,rowss,fields){
        if(err){
            console.log("ERROR in retrieving from DB")
        }else{
            console.log("Successfully retrieved from DB")
                if(rowss[0]['status']=="login"){
                    connection.query("SELECT * FROM yelpcamp",function(err,rows,fields){
                        if(err){
                            console.log("ERROR in retrieving from DB")
                        }else{
                            console.log("Successfully retrieved from DB")
                            res.render("campgrounds",{campgrounds:rows,cg:rowss})
                        }
                    });
                }else{
                    res.redirect("/login")
                }
        }
    })  
});

//NEW ROUTE
router.get("/campgrounds/new",function(req,res){
    res.render("new")
});

router.post("/campgrounds",function(req,res){
    var name=req.body.name
    var image=req.body.image
    var desc=req.body.description
    var userid=req.params.id
    create(name,image,desc)
    res.redirect("/campgrounds")
});
//SHOW ROUTE
router.get("/campgrounds/:id",function(req,res){
    var ID=req.params.id
    connection.query("SELECT * FROM yelpcamp yp JOIN comments c ON c.UserId=yp.UserId WHERE yp.UserId=?",[ID],function(err,rows,field){
        if(err){
            console.log("Error to retrieve data using ID")
        }else{
            console.log("Successful")
            res.render("show",{campground:rows});
        }
    });
});

module.exports=router;