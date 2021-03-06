var Client = function(id){
  this.id = id;
  this.dataReaders = {};
  this.commands = {};
}

Client.prototype.connect = function(endpoint,connected){
  var socket = require('socket.io-client')(endpoint);
  var client = this;
  client.socket = socket;
  socket.on('connect', function(){
    console.log("connected");
    socket.emit('init',{clientType:'eddy',id: client.id});
    connected();
    for(var name in client.dataReaders) {
      if(client.dataReaders.hasOwnProperty(name)){
        var reader = client.dataReaders[name];
        reader.iid = setInterval(reader.callback,reader.interval);
      }
    }
  });

  socket.on('disconnect', function(){
    console.log("disconnected");
    client.shutdown();
    console.log("shutdown");
  });

  socket.on('command',function(data){
    var commandName = data.command;
    if (client.commands[commandName]){
      client.commands[commandName](data);
    }
  });
}

Client.prototype.shutdown = function(){
  for(var name in this.dataReaders) {
    if(this.dataReaders.hasOwnProperty(name)){
      var reader = this.dataReaders[name];
      clearInterval(reader.iid);
    }
  }
  this.socket.close();
}

Client.prototype.read = function(sensorName,valueFn,interval){
  var client = this;
  var callback = function(){
    var value = valueFn();
    var eventName = 'eddy_data';
    var eventData = {id:client.id,sensor:sensorName,value:value,ts:new Date()};
    client.socket.emit(eventName,eventData);
  }
  this.dataReaders[sensorName] = {callback:callback,interval:interval};
}

Client.prototype.on = function(commandName,handlerFn){
  this.commands[commandName] = handlerFn;
}


module.exports = Client;