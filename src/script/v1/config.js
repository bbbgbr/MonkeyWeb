module.exports = function(app,db,post,auth){
    var configDB = db.collection('config');
    var configType = {
        year : "number",
        quarter : "number",
        nextStudentID : "number",
        nextTutorID : "number",
        allowRegistration : "boolean",
        coursePrice : "number",
        inSummer : "boolean"
    }
    var parseConfig = function(key,value){
        if ((typeof value) == "object"){
            for(let i in value) value[i] = parseConfig(i,value[i]);
            return value;
        }
        else if(configType[key]){
            if(configType[key] == "number") return Number(value);
            else if(configType[key] == "boolean") return value+'' == "true";
            else return value
        } else return value;
    }
    post("/post/v1/editConfig",async function(req,res){
        if(!auth.authorize(req.user,"staff","dev")){
            return res.status(401).send({
                err : 401,
                msg : "unauthorized"
            })
        }
        try{
            let config = await configDB.findOne({_id:"config"})
            for(let i in req.body) if(config[i] != undefined) config[i] = parseConfig(i,req.body[i]);
            await configDB.updateOne({},{$set : config})
        }catch(e){
            return res.status(400).send({err:400 , msg:e})
        }
        return res.status(200).send({msg:"success"})
    })
    post('/post/v1/editDefaultQuarter',async function(req,res){
        if(!auth.authorize(req.user,"staff","dev")){
            return res.status(401).send({
                err : 401,
                msg : "unauthorized"
            })
        }
        try{
            let config = await configDB.findOne({_id:"config"})
            let defaultQuarter = config.defaultQuarter;
            for(let i in req.body) if(defaultQuarter[i]) defaultQuarter[i] = parseConfig(i,req.body[i]);
            await configDB.updateOne({},{$set : {defaultQuarter : defaultQuarter}})
        }catch(e){
            return res.status(400).send({err:400 , msg:e})
        }
        return res.status(200).send({msg:"success"})
    })
}