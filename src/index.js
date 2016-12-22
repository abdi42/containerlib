var docker = require("./lib/dockerhttp.js");
var dockerhttp = docker('127.0.0.1','4243');

var containerLib = function(config,callback){
  var containerId = null;

  var containerOpts = {
      AttachStdout: true,
      AttachStderr: true,
      Image: config.image,
      OpenStdin: true,
      Volumes: {},
      NetworkDisabled:true,
      HostConfig:{
        Binds:config.binds
      },
      Cmd: config.commands
  }

  containerOpts.Volumes[config.volume] = {};


  dockerhttp.post("/containers/create", containerOpts, function(err, body) {
      if (err) return callback(err)

      containerId = body.Id;

      dockerhttp.post("/containers/" + containerId + "/start", {}, function(err, body) {
          if (err) return callback(err)

          return {
            removeContainer:function(){
              dockerhttp.post("/containers/"+containerId+"/stop",{},function(err){
                  dockerhttp.delete("/containers/"+containerId,{},function(err){
                  })
              })
            },
            createExec:function(commands){
              var execOpts = {
                AttachStdout: true,
                AttachStderr: true,
                Tty: false,
                Cmd: commands
              }

              dockerhttp.post("/containers/"+containerId+"/exec",execOpts,function(err,body){
                  if(err) return callback(err)
                  return {
                    start:function(){
                      dockerhttp.post("/exec/"+body.Id+"/start",{ Detach: false,Tty: false },function(err){
                          if(err) return callback(err)

                          return callback(null);
                      })
                    }
                  }
              })

            },
            containerId:containerId
          }
      })
  })

}
