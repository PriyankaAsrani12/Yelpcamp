//==============================================
//REQUIRING AND USING
var express=require("express")
var app=express()
var passport=require("passport")
var bodyParser=require("body-parser")
var mysql=require("mysql")
var session=require("express-session")
var methodOverride=require("method-override")
var flash=require("connect-flash")
app.set("view engine","ejs")
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(methodOverride("_method"))
app.use(flash())
app.use(session({
    secret:"Priyanka",
    resave:false,
    saveUninitialized:false,
}));
//==============================================
//MYSQL CONNECTION
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

//==============================================
//SERIALIZING AND DESERILIZING
passport.serializeUser(function(username, done) {
    done(null, username.id);
});

passport.deserializeUser(function(id, done) {
    connection.query("select * from auth where id = "+id,function(err,rows){    
        done(err, rows[0]);
    });
});
app.use(passport.initialize());
app.use(passport.session());

//==============================================
//FUNCTION TO CREATE NEW CAMPGROUND IN DB
function create(name,image,desc,price){
    connection.query("SELECT * FROM auth WHERE status='login'",function(error,rowss,field){
        if(error){
            console.log("ERROR")
        }else{
            connection.query("INSERT INTO yelpcamp(Name,ImageURL,Description,CreatedBy,price) VALUES(?,?,?,?,?)",[name,image,desc,rowss[0]["username"],price],function(err,rows,field){
                if(err){
                    console.log("Not stored in DB. Some ERROR!")
                }else{
                    console.log("Successfully stored in DB!")
                }
            });
            connection.query("SELECT UserId FROM yelpcamp WHERE Name=? AND ImageURL=? AND Description=?",[name,image,desc],function(error,rows1,field){
                if(error){
                    console.log("ERROR")
                }else{
                    connection.query("INSERT INTO comments(UserId,comments,author) VALUES(?,?,?)",[rows1[0]['UserId'],'Default Comment','Default author'],function(error,rows2,field){
                        if(error){
                            console.log("ERROR")
                        }else{
                            console.log("Done")
                        }
                    });
                }
            })
        };
    })
}
    

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

//==============================================
//INDEX ROUTE
app.get("/",function(req,res){
    res.render("landing",{message:req.flash("success")})
});

//ALL CAMPGROUNDS ROUTE
app.get("/campgrounds",function(req,res){
    // Get all the campgrounds from the DB
    connection.query("SELECT * FROM auth WHERE status='login'",function(err,rowss,fields){
        if(err){
            console.log("ERROR in retrieving from DB")
        }else{
            console.log("Successfully retrieved from DB")
            if(rowss[0]!=undefined){
                if(rowss[0]['status']=="login"){
                    connection.query("SELECT * FROM yelpcamp",function(err,rows,fields){
                        if(err){
                            console.log("ERROR in retrieving from DB")
                        }else{
                            console.log("Successfully retrieved from DB")
                            res.render("campgrounds",{campgrounds:rows,cg:rowss,mess:req.flash("success")})
                        }
                    });
                }else{
                    req.flash("error","Please login first!")
                    res.redirect("/login")
                }
            }else{
                req.flash("error","Please login first!")
                res.redirect("/login")
            }
        }
    });  
});

//NEW ROUTE
app.get("/campgrounds/new",function(req,res){
    res.render("new")
});

app.post("/campgrounds",function(req,res){
    var name=req.body.name
    var image=req.body.image
    var desc=req.body.description
    var price=req.body.price
    create(name,image,desc,price)
    res.redirect("/campgrounds")
});
//SHOW ROUTE
app.get("/campgrounds/:id",function(req,res){
    var ID=req.params.id
    connection.query("SELECT * FROM yelpcamp yp JOIN comments c ON c.UserId=yp.UserId WHERE yp.UserId=?",[ID],function(err,rows,field){
        if(err){
            console.log("Error to retrieve data using ID")
        }else{
            console.log("Successfull")
            connection.query("SELECT * FROM auth WHERE status='login'",function(error,rowss,field){
                if(error){
                    console.log("ERROR")
                }else{
                    res.render("show",{campground:rows,cg:rowss,message:req.flash("error"),mess:req.flash("success")});
                }
            })
        }

    });
});

//==============================================
//COMMENTS ROUTE
app.get("/campgrounds/:id/comments/new",function(req,res){
    var id=req.params.id
    connection.query("SELECT * FROM auth WHERE status='login'",function(err,rowss,fields){
        if(err){
            req.flash("error","Something went wrong!")
            console.log("ERROR in retrieving from DB")
        }else{
            console.log("Successfully retrieved from DB")
                if(rowss[0]['status']=="login"){
                    connection.query("SELECT * FROM yelpcamp yp JOIN comments c ON c.UserId=yp.UserId WHERE yp.UserId=?",[id],function(error,rows,field){
                        if(error){
                            console.log(error)
                        }else{
                            res.render("newcomment",{campground:rows,cg:rowss})
                        }   
                    });
                }
            }
    });
});
app.post("/campgrounds/:id/comments",function(req,res){
    var id=req.params.id
    var comment=req.body.comment.text
    var author=req.body.comment.author
    connection.query("SELECT * FROM yelpcamp yp JOIN comments c ON c.UserId=yp.UserId WHERE yp.UserId=?",[id],function(error,rows,field){
        if(error){
            req.flash("error","Something went wrong!")
            console.log(error)
        }else{
            createComment(id,comment,author)
            console.log("Successfully created a comment!")
            req.flash("success","Successfully added comment")
            res.redirect("/campgrounds/"+id)
        }
    });
});

app.get("/campgrounds/:id/comments/:commentid/edit",function(req,res){
    var id=req.params.id
    var commentId=req.params.commentid
    connection.query("SELECT * FROM yelpcamp yp JOIN comments c ON c.UserId=yp.UserId WHERE yp.UserId=?",[id],function(error,rows,field){
        if(error){
            console.log(error)
        }else{
            connection.query("SELECT * FROM comments WHERE CommentId=?",[commentId],function(error,rowss,field){
                if(error){
                    console.log("ERROR")
                }else{
                    res.render("editcomment",{campground:rowss})
                }
            })
        }
    });
})
app.put("/campgrounds/:id/comments/:commentid/edit",function(req,res){
    var id=req.params.id
    var commentId=req.params.commentid
    var comment=req.body.comment.text
    connection.query("UPDATE comments SET comments=? WHERE CommentId=?",[comment,commentId],function(error,rows,field){
        if(error){
            console.log("ERROR")
        }else{
            console.log("Successfull")
            res.redirect("/campgrounds/"+id)
        }
    })
})
app.delete("/campgrounds/:id/comments/:commentid",function(req,res){
    var id=req.params.id
    var commentId=req.params.commentid
    connection.query("DELETE FROM comments WHERE CommentId=?",[commentId],function(error,rows,field){
        if(error){
            console.log("ERROR")
        }else{
            console.log("Successfull")
            res.redirect("/campgrounds/"+id)
        }
    })
})
//==============================================
//EDIT CAMPGROUND ROUTE
app.get("/campgrounds/:id/edit",function(req,res){
    var ID=req.params.id
    connection.query("SELECT * FROM auth WHERE status='login'",function(error,rowss,field){
        if(error){
            console.log("ERROR")
        }else{
            connection.query("SELECT * FROM yelpcamp WHERE UserId=?",[ID],function(err,rows,field){
                if(err){
                    console.log("Error to retrieve data using ID")
                }else{
                    console.log("Successfull")
                    if(rowss[0]["username"]==rows[0]["CreatedBy"]){
                        res.render("edit",{campground:rows});
                    }else{
                        req.flash("error","You don't have the permission to do that!")
                        res.redirect("/campgrounds/"+ID)
                    }
                }
            });
        }
    })
})

//==============================================
//UPDATE CAMPGROUND ROUTE
app.put("/campgrounds/:id/edit",function(req,res){
    var id=req.params.id
    var name=req.body.name
    var image=req.body.image
    var desc=req.body.description
    connection.query("UPDATE yelpcamp SET Name=?,ImageURL=?,Description=? WHERE UserId=?",[name,image,desc,id],function(error,rows,field){
        if(error){
            console.log("ERROR in updating")
        }
        else{
            console.log("No ERROR in updating")
            res.redirect("/campgrounds/"+id)
        }
    })
})

//==============================================
//DELETING UPDATE CAMPGROUND
app.delete("/campgrounds/:id",function(req,res){
    var id=req.params.id
    connection.query("SELECT * FROM auth WHERE status='login'",function(error,rowss,field){
        if(error){
            console.log("ERROR")
        }else{
            connection.query("SELECT * FROM yelpcamp WHERE UserId=?",[id],function(error,rowss1,field){
                if(error){
                    console.log("ERROR")
                }else{
                    if(rowss[0]["username"]==rowss1[0]["CreatedBy"]){
                        connection.query("DELETE FROM yelpcamp WHERE UserId=?",[id],function(error,rows,field){
                            if(error){
                                console.log("ERROR in deleting data")
                            }
                            else{
                                console.log("No ERROR in deleting data")
                                req.flash("success","Successfully delete campground")
                                res.redirect("/campgrounds")
                            }
                        })
                    }else{
                        res.redirect("back")
                    }
                }
            })
        }
    })
})

//==============================================
//LOGIN ROUTES
app.get("/",function(req,res){
    res.render("Home")
});

//SIGNUP ROUTE
app.get("/register",function(req,res){
    res.render("register",{message:req.flash("error")})
});
app.post("/register",function(req,res){
    var username=req.body.username;
    var password=req.body.password;
    if(username==""&&password==""){
        req.flash("error","Username and password cannot be empty!")
        res.redirect("/register")
    }else{
        connection.query("SELECT * FROM auth WHERE username=? AND password=?",[username,password],function(error,rows,field){
            if(error){
                console.log("Error")
                console.log(error)
            }else if(rows.length==0){
                connection.query("INSERT INTO auth(username,password) VALUES(?,?)",[username,password],function(error,rows,field){
                    if(error){
                        console.log("Error in inserting to database")
                        console.log(error)
                    }else{
                        passport.authenticate("local")(req,res,function(){
                            console.log("Successfull!")
                            req.flash("success","Successfully registered user as "+username)
                            res.redirect('/login');
                        })
                    }
                })
            }else{
                console.log("User already exist!")
                res.redirect("/register")
            }
        });
    }
});

//==============================================
//LOGIN
app.get("/login",function(req,res){
    res.render("login",{message:req.flash("error"),mess:req.flash("success")})
})

app.post("/login",function(req,res){
    var id=req.params.id
    var user=req.body.username
    var password=req.body.password
    if(user==""&&password==""){
        req.flash("error","Username and password cannot be empty!")
        res.redirect("/login")
    }else{
        connection.query("SELECT * FROM auth WHERE username=?",[user],function(error,rows,field){
            if(error){
                console.log("ERROR")
            }else{
                if(rows.length==0){
                    console.log("No user found")
                    req.flash("error","Opps! No user found")
                    res.redirect("/login")
                }else{
                    if(rows[0]["password"]!=password){
                        console.log("Opps Wrong password")
                        req.flash("error","Opps! Wrong password")
                        res.redirect("/login")
                    }else{
                        passport.authenticate("local")(req,res,function(){
                            console.log("Successfull!")
                            connection.query("UPDATE auth SET status='login' WHERE username=?",[user],function(error,rows,field){
                                if(error){
                                    console.log("ERROR")
                                }else{
                                    console.log("Success!")
                                }
                            })
                            req.flash("success","Successfully logged in as "+user)
                            res.redirect('/campgrounds');
                        })
                    }
                }
            }
        });
    }
});

//==============================================
//LOGOUT ROUTE
app.get("/logout",function(req,res){
    req.logout();
    connection.query("UPDATE auth SET status='logout'",function(error,rows,field){
        if(error){
            console.log("ERROR")
        }else{
            console.log("Successfully logged out!")
            req.flash("success","Successfully, logged you out!")
            res.redirect("/")
        }
    });
});

//==============================================
//SERVER LISTENING
app.listen(5000,process.env.IP,function(){
    console.log("YelpCamp Started")
});




//cannot register twice with the same username
//displaying default comment--either remove defaulr to do something so that it doesnt displays