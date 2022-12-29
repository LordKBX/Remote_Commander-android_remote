var WebSocketServer = require('websocket').server;
var http = require('http');
var https = require('https');
var chokidar = require('chokidar');
var fs = require('fs');
var path = require('path');

var args = { /* defaults */
	port: '8345',
	debug: false
};

var appdir = fs.readFileSync("../services/appdir.txt")
var directory = path.resolve('../'+appdir+'/www');

var port = 8345;

var server = https.createServer({
    cert: fs.readFileSync(__dirname+'\\remote.cert'),
    key: fs.readFileSync(__dirname+'\\remote.key')
},function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.end();
});
server.listen(port, function() {
	console.log((new Date()) + ' Server is listening on port ' + port);
});

var wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: true,
	maxReceivedFrameSize: 64*1024*1024,   // 64MiB
	maxReceivedMessageSize: 64*1024*1024, // 64MiB
	fragmentOutgoingMessages: false,
	keepalive: false,
	disableNagleAlgorithm: false
});

var watcher = null;
wsServer.on('error', function(err){ console.error(err); });
wsServer.on('connect', function(connection) {
	console.log((new Date()) + ' Connection accepted' + ' - Protocol Version ' + connection.webSocketVersion);
	watcher = chokidar.watch(directory);
	console.log('directory = ', directory);
	interval = setInterval(function(e){
		connection.sendUTF('ping', function(e){});
	}, 3000);
	
	function watcherUpdate(path, type, event_data){
		  console.log(path, type, event_data);
		  connection.sendUTF(type+'|'+path, sendCallback);
		}
	
	watcher.on('ready', (event, path) => {
		connection.sendUTF("READY", sendCallback);
	  watcher
		.on('add', (path, event) => { watcherUpdate(path, 'add', event); })
		.on('change', (path, event) => { watcherUpdate(path, 'change', event); })
		.on('unlink', (path, event) => { watcherUpdate(path, 'unlink', event); });
	});
	
	function sendCallback(err) {
		if (err) {
		  console.error('send() error: ' + err);
		  connection.drop();
		}
	}
	
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			console.log('Received utf-8 message of ' + message.utf8Data.length + ' characters.');
			if(message.utf8Data == 'List'){
				wd = watcher.getWatched();
				tab = [];
				base = '';
				line = 0;
				excludeList = ['.DS_Store'];
				for(index in wd){
					if(line == 1){ base = index; }
					if(line >= 1){
						for(i=0; i<wd[index].length; i++){
							if(excludeList.indexOf(wd[index][i]) != -1){ continue; }
							tf = index.replace(base, '') + '/' + wd[index][i];
							console.log(tf);
							if(fs.statSync(base+tf).isFile()){
								tab.push(tf.replace(path.sep, '/'));
							}
						}
					}
					line = line + 1;
				}
				data = 'List:'+JSON.stringify(tab);
				connection.sendUTF(data, sendCallback);
				}
			else if(message.utf8Data.indexOf('Load:') == 0){
				tab = message.utf8Data.split(':');
				fdata = null;
				try{
					//console.log(directory+tab[1]);
					fdata = fs.readFileSync((directory+tab[1]).replace('/', path.sep));
					fdata = fdata.toString('base64');
				}
				catch(error){ }
				blockSize = 4000;
				nbBlocks = (fdata.length > blockSize)?(parseInt(fdata.length / blockSize) + ((fdata.length % blockSize !== 0)?1:0)):1;

				console.log(tab[1]);
				console.log(' => ', 'nbBlocks = '+nbBlocks);
				console.log(' => ', 'blockSize = '+blockSize);
				console.log(' => ', 'fdata.length = '+fdata.length);
				if(nbBlocks > 1){
					totalLength = 0;
					for(bl=0; bl<nbBlocks; bl = bl + 1){
						max = ((bl+1) * blockSize);
						if(max >= fdata.length){ max = fdata.length; }
						dataBlock = fdata.substring(bl*blockSize, max);
						totalLength = totalLength + dataBlock.length;
						data = 'Load:'+tab[1].replace(new RegExp('\\\\', 'g'), '/')+':'+(bl+1)+'|'+nbBlocks+':'+dataBlock;
						try{ connection.sendUTF(data, sendCallback);}
						catch(error){ console.error(error); }
					}
					console.log(' => ', 'totalLength = '+totalLength);
				}
				else{
					data = 'Load:'+tab[1].replace(new RegExp('\\\\', 'g'), '/')+':'+fdata;
					try{ connection.sendUTF(data, sendCallback);}
					catch(error){ console.error(error); }
					}
				}
			else{ connection.sendUTF(message.utf8Data, sendCallback); }
		}
		else if (message.type === 'binary') {
			try{ 
				console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
				connection.sendBytes(message.binaryData, sendCallback);
			}
			catch(error){ console.error(error); }
		}
	});
	
	connection.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		try{ connection._debug.printOutput(); }
		catch(error){ console.error(error); }
	});
});