module.exports = function(app,db,post,passport){
    let userDB = db.collection('user')
    // console.log(passport.authorize)
    post('/post/v1/login', function(req,res,next){
        passport.authenticate('local', function(err,user){    
            if(err) throw err;
            if(!user) res.status(202).send({
                err : 202,
                msg : "This ID or password do not match."
            });
            else{
                req.logIn(user , function(err){
                    if(err) throw err;
                    let redirect
                    if(user.position == 'student') redirect = '/';
                    else if(user.position == 'tutor') redirect = 'tutorCheck';
                    else{ redirect = 'adminAllStudent' }
                    res.status(200).send({msg : 'ok' , redirect : redirect , status : req.isAuthenticated()})
                    // res.location('/test')
                })
            }
        })(req,res,next)
    })
    post('/post/v1/isLoggedIn', function(req,res,next){
        if(req.isAuthenticated()) res.status(200).send({loggedIn : true , position : req.user.position})
        else{res.status(202).send({loggedIn : false})}
    })
    post('/post/v1/logout',function(req,res,next){
        req.logOut()
    })
    app.get('/logout',function(req,res,next){
        req.logOut();
        res.redirect('/')
    })
    post('/post/v1/verifyRegisUser',async function(req,res){
        if(!(req.body.id && req.body.pwd)) res.status(401).send({verified:false})
        try {
            let user = await userDB.findOne({_id:Number(req.body.id) , password:req.body.pwd})
            if(user.position && user.position!='student') return res.status(200).send({verified:true})
            else return res.status(401).send({verified:false})    
        } catch (error) {
            console.log(err)
            return res.status(400).send({err:error})   
        }
    })
    
    app.get('/testpostmanrequestlogin',function(req,res,next){
        passport.authenticate('local', function(err,user){    
            if(err) throw err;
            if(!user) res.status(202).send({
                err : 202,
                msg : "This ID or password do not match."
            });
            else{
                req.logIn(user , function(err){
                    if(err) throw err;
                    let redirect
                    if(user.position == 'student') redirect = '/';
                    else if(user.position == 'tutor') redirect = 'tutorCheck';
                    else{ redirect = 'adminAllStudent' }
                    res.status(200).send({msg : 'ok' , redirect : redirect , status : req.isAuthenticated()})
                    // res.location('/test')
                })
            }
        })(req,res,next)
    });
}