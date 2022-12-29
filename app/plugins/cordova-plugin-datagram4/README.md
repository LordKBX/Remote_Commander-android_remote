cordova-plugin-datagram
=======================

CLONE FROM [https://github.com/masashiGMS/cordova-plugin-datagram]

Cordova plugin for sending datagram/UDP. Supports multicast UDP.


In order to improvement, masashiGMS modified some code from original.

###Install
```bash
$> cordova plugin add https://github.com/masashiGMS/cordova-plugin-datagram.git
```

-----
###example

```js
var datagram = cordova.require("cordova-plugin-datagram4.datagram");
var socket = datagram.createSocket("udp4");
var myPort = 3000;
var targetPort = 3001;
var targetIp = "target device ip";

socket.bind(listenPort, function(data) {
  alert("bind \n" + JSON.parse(data));
});

socket.on("message", function(data, info) {
  console.log(data + " / " + JSON.stringify(info));
});

var button = document.getElementById("button");
button.addEventListener(button, "click", function() {
  var message = "HelloWorld";
  if (message.length > 20480) {
    alert("Too large!");
    return;
  }
  socket.send(message, targetIp, targetPort, function() {
    alert("done");
  });
});
```

-----

###example2

client
```js
var broadcastSocket = datagram.createSocket("multicast-udp4");
broadcastSocket.bind(3003, function(data) {});
broadcastSocket.on("message", function(data, info) {
  alert(data);
  alert(JSON.stringify(info));
});

// Find a server using broadcasting.
var button = document.getElementById("button");
button.addEventListener("click", function() {
  broadcastSocket.send("Hello", "255.255.255.255", 3002, function() {
    
  });
});
```

server
```js
var broadcast = datagram.createSocket("multicast-udp4");
broadcast.bind(3002, function(data) {});
broadcast.on("message", function(data, info) {
  alert(data);
  alert(JSON.stringify(info));
  broadcast.send("Hi!", info.address, 3003, function() {
    
  });
});
```


