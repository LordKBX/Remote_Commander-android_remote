//applicationDirectory
document.addEventListener('deviceready', onDeviceReady, false);
var socket = null;
var nbFiles = 0;
var loadedFiles = 0;
var appMode = 'debug';
var debugHost = '';
var dataTab = [];

function MGUID(){var currentDateMilliseconds=new Date().getTime();var currentDateSeconds=parseInt(currentDateMilliseconds/1000,10);var currentDateMilli=currentDateMilliseconds-(currentDateSeconds*1000);var str="_"+currentDateSeconds+'-'+currentDateMilli+'-pxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(currentChar){var randomChar=(currentDateMilliseconds+Math.random()*16)%16|0;currentDateMilliseconds=Math.floor(currentDateMilliseconds/16);return(currentChar==='x'?randomChar:(randomChar&0x7|0x8)).toString(16);});return str.substring(1);}

function clone(obj) {
	if (null === obj || "object" != typeof obj) return obj;
	var copy = obj.constructor();
	for(var attr in obj){ if(obj.hasOwnProperty(attr)){copy[attr] = obj[attr];} }
	return copy;
}

function listDir(path, callback){
	window.resolveLocalFileSystemURL(path,
		function (fileSystem) {
			var reader = fileSystem.createReader();
			reader.readEntries(
				function (entries) {
					console.log(entries);
					var i;
					tab = [];
					for (i=0; i<entries.length; i++) {
						tab.push(entries[i].name);
					}
					callback(tab);
				},
				function (err) {
					callback(false);
					console.error('listDir error 2', err);
				}
			);
			}, function (err) {
			callback(false);
			console.error('listDir error 1', err);
		}
	);
}

function createDir(pathParent, name, callback){
	window.resolveLocalFileSystemURL(pathParent,
		function (fileSystem) {
			fileSystem.getDirectory(name, { create: true, exclusive: false }, 
				function(ret){
					callback(true);
				}, 
				function(ret){
					callback(false);
				}
			);
		}
	);
}

function cleanDir(path, callback){
	window.resolveLocalFileSystemURL(path,
		function (fileSystem) {
			var reader = fileSystem.createReader();
			reader.readEntries(
				function (entries) {
					var i;
					tab = [];
					for (i=0; i<entries.length; i++) {
						fileSystem.getFile(entries[i].name, { create: false }, function (fileEntry) {
							fileEntry.remove(
								function () {
								}, 
								function (error) {
									console.error('cleanDir error 3', err);
									callback(false);
									return;
								}, 
								function () {
									
								}
							);
						});
					}
					callback(true);
				},
				function (err) {
					callback(false);
					console.error('cleanDir error 2', err);
				}
			);
			}, function (err) {
			callback(false);
			console.error('cleanDir error 1', err);
		}
	);
}

function readFile(fileEntry, callback) {
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function() {
            // console.log("Successful file read: " + this.result);
            // console.log(fileEntry.fullPath + ": " + this.result);
			if(callback !== undefined){
				callback(this.result);
			}
		};
        reader.readAsText(file);
	}, function(e){ console.log("Failed file read: " + e.toString()); });
}

function loadIFileInBlob(filename, dest_id, file_type, callback) { //type: "image/png"
    window.resolveLocalFileSystemURL(filename, function success(fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function() {
                if (this.result) {
                    var blob = new Blob([new Uint8Array(this.result)], { type: file_type });
                    callback(window.URL.createObjectURL(blob), dest_id)
                    elem.src = window.URL.createObjectURL(blob);
				}
			};
            reader.readAsArrayBuffer(file);
		});
		}, function () {
        console.log("File not found: ");
	});
}

function writeFile(fileEntry, dataObj, callback) {
    // Create a FileWriter object for our FileEntry (log.txt).
    fileEntry.createWriter(function (fileWriter) {
		
        fileWriter.onwriteend = function() {
            //console.log("Successful file write...");
            //readFile(fileEntry);
		};
		
        fileWriter.onerror = function (e) {
            console.log("Failed file write: " + e.toString());
		};
		
        // If data object is not passed in,
        // create a new Blob instead.
        if (!dataObj) {
            dataObj = new Blob(['some file data'], { type: 'text/plain' });
		}
		
        fileWriter.write(dataObj);
		
		if(callback !== undefined){ callback(fileEntry.name); }
	});
}

function onErrorFunc(evt){ console.error(evt); }

function sureBDbgPath(path){ return path.replace(new RegExp('\\/', 'g'), '__').replace(new RegExp('\\\\', 'g'), '__'); }

function dbgPath(path){
	if(path[0] == '/'){ path = path.replace('/', ''); }
	if(appMode == 'debug'){ return sureBDbgPath(path); }
	else{ return path; }
}

function ReadDataFile(path, callback){
	window.resolveLocalFileSystemURI(cordova.file.dataDirectory+path, function (fileEntry) {
		readFile(fileEntry, callback);
	}, 
	function(error){  console.error(error); });
}

function DirectReadDataFile(path, callback, callback2){
	window.resolveLocalFileSystemURI(path, function (fileEntry) {
		readFile(fileEntry, callback);
	}, 
	function(error){  console.error(error); if(callback2 !== undefined){ callback2(); } });
}

function WriteDataFile(path, data, callback, dir){
	path = path.replace('/', '');
	tpath = path.split('/');
	lpath = '';
	if(tpath.length > 1){ for(i=0; i<tpath.length-1; i++){ lpath = tpath[i] + '/'; } }
	
	window.resolveLocalFileSystemURL(cordova.file.dataDirectory ||dir, function (dirEntry) {
		subWriteDataFile(cordova.file.dataDirectory, cordova.file.dataDirectory+path,  data, dirEntry, callback);
	}, 
	function(error){  console.error(error); });
}

function subWriteDataFile(path, endPath, data, dirEntry, callback) {
	tpath = endPath.replace(path, '').replace(new RegExp('/', 'g'), '__');
	dirEntry.getFile(tpath, { create: true, exclusive: false }, function (fileEntry) {
		writeFile(fileEntry, data, callback);
	}, function(error){ console.error(error); });
}

function b64toBlob(b64Data, contentType, sliceSize) {
	contentType = contentType || '';
	sliceSize = sliceSize || 512;
	
	var byteCharacters = null;
	try{ byteCharacters = atob(unescape(encodeURIComponent(b64Data))); }
	catch(error){ console.error(error); return null; }
	
	var byteArrays = [];
	
	for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		var slice = byteCharacters.slice(offset, offset + sliceSize);
		
		var byteNumbers = new Array(slice.length);
		for (var i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}
		
		var byteArray = new Uint8Array(byteNumbers);
		
		byteArrays.push(byteArray);
	}
	
	var blob = new Blob(byteArrays, {type: contentType});
	return blob;
}

/**
	* Create a Image file according to its database64 content only.
	* 
	* @param folderpath {String} The folder where the file will be created
	* @param filename {String} The name of the file that will be created
	* @param content {Base64 String} Important : The content can't contain the following string (data:image/png[or any other format];base64,). Only the base64 string is expected.
*/
function savebase64AsFile(folderpath,filename,content,contentType, callback){
    // Convert the base64 string in a Blob
    var DataBlob = b64toBlob(content,contentType);
    if(DataBlob === null){ console.error('File =>', filename); }
    
    window.resolveLocalFileSystemURL(folderpath, function(dir) {
        //console.log("Access to the directory granted succesfully");
		dir.getFile(filename, { create:true, exclusive: false }, function(file) {
            //console.log("File created succesfully.");
            file.createWriter(function(fileWriter) {
                //console.log("Writing content to file");
                fileWriter.write(DataBlob);
                callback(filename);
				}, function(){
                console.error('Unable to save file in path '+ folderpath);
			});
		});
	});
}

function onDeviceReady() {
	// Cordova is now initialized. Have fun!
	
	window.resolveLocalFileSystemURL(cordova.file.applicationDirectory+'www/', function (dirEntry) {
		console.log('file system open: ' + dirEntry.name);
		dirEntry.getFile("mode.txt", { create: false, exclusive: false }, function (fileEntry) {
			createDir(cordova.file.dataDirectory, 'tmp', function(ret){});
			cleanDir(cordova.file.dataDirectory+'tmp/', function(e){});
			readFile(fileEntry, function(ret){
				if(ret.indexOf('debug') === 0){
					appMode = 'debug';
					rt = ret.split(':');
					port = 8345;
					host = rt[1].trim();
					debugHost = host;
					console.log(host, port);
					socket = new WebSocket("wss://"+host+':'+port,13);
					socket.onopen = sockectOnOpen;
					socket.onmessage = sockectOnMessage;
					socket.onclose = sockectOnClose;
					socket.onerror = sockectOnError;
				}
				else{
					appMode = 'release';
					
					lnk = document.createElement('link');
					lnk.setAttribute('rel', 'stylesheet');
					lnk.setAttribute('type', 'text/css');
					lnk.setAttribute('media', 'all');
					lnk.setAttribute('href', 'css/app.css');
					document.getElementsByTagName('head')[0].appendChild(lnk);
					
					lnk = document.createElement('link');
					lnk.setAttribute('rel', 'stylesheet');
					lnk.setAttribute('type', 'text/css');
					lnk.setAttribute('media', 'all');
					lnk.setAttribute('href', 'css/jquery-ui.css');
					document.getElementsByTagName('head')[0].appendChild(lnk);
					
					lnk = document.createElement('link');
					lnk.setAttribute('rel', 'stylesheet');
					lnk.setAttribute('type', 'text/css');
					lnk.setAttribute('media', 'all');
					lnk.setAttribute('href', 'css/jquery-ui.structure.css');
					document.getElementsByTagName('head')[0].appendChild(lnk);
					
					lnk = document.createElement('link');
					lnk.setAttribute('rel', 'stylesheet');
					lnk.setAttribute('type', 'text/css');
					lnk.setAttribute('media', 'all');
					lnk.setAttribute('href', 'css/jquery-ui.theme.css');
					document.getElementsByTagName('head')[0].appendChild(lnk);
					
					script = document.createElement('script');
					script.setAttribute('type', 'text/javascript');
					script.setAttribute('src', 'js/jquery-ui.js');
					document.body.appendChild(script);
					
					script = document.createElement('script');
					script.setAttribute('type', 'text/javascript');
					script.setAttribute('src', 'js/base64.min.js');
					document.body.appendChild(script);
					
					script = document.createElement('script');
					script.setAttribute('type', 'text/javascript');
					script.setAttribute('src', 'js/crypto.js');
					document.body.appendChild(script);
					
					script = document.createElement('script');
					script.setAttribute('type', 'text/javascript');
					script.setAttribute('src', 'js/main.js');
					document.body.appendChild(script);
				}
				console.log("Im: " + ret);
			});
		}, onErrorFunc);
	}, onErrorFunc);
}

function sockectOnOpen(e){
	console.log("Connection established");
}
function sockectOnClose(event){
	if (event.wasClean) {
		console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
		// e.g. server process killed or network down
		// event.code is usually 1006 in this case
		console.log('[close] Connection died');
	}
	
	socket = new WebSocket("wss://"+host+':'+port,13);
	socket.onopen = sockectOnOpen;
	socket.onmessage = sockectOnMessage;
	socket.onclose = sockectOnClose;
	socket.onerror = sockectOnError;
}
function sockectOnError(error) {
	console.log(`[error]`, error);
}

function sockectOnMessage(event) {
	//console.log(`[message] Data received from server:`, event.data.substring(0, 100)+((event.data.length>100)?'...':''));
	if(event.data == 'READY'){
		socket.send("List");
	}
	else if(event.data.indexOf('List:') === 0){
		try{
			data = JSON.parse(event.data.replace('List:', ''));
			console.log(data);
			nbFiles = data.length;
			for(i=0; i<data.length; i++){
				socket.send("Load:"+data[i]);
			}
		}
		catch(error){}
	}
	else if(event.data.indexOf('Load:') === 0){
		contentTypeArray={
			'png':'image/png', 
			'jpg':'image/jpeg', 
			'jpeg':'image/jpeg', 
			'gif':'image/gif', 
			'bmp':'image/bmp', 
			'webp':'image/webp'
		};
		
		tdata = event.data.split(':');
		
		ext = tdata[1].toLowerCase().split('.');
		ext = ext[ext.length - 1];
		contentType = (contentTypeArray[ext] === undefined)?'text/plain':contentTypeArray[ext];
		
		dataf = tdata[2];
		
		//console.log(tdata);
		if(tdata.length >= 4){
			pagination = tdata[2].split('|');
			if(dataTab[tdata[1]] === undefined){ dataTab[tdata[1]] = []; }
			if(parseInt(pagination[0]) == 1){ dataTab[tdata[1]] = []; }
			dataTab[tdata[1]][parseInt(pagination[0])-1] = tdata[3];
			if(parseInt(pagination[0]) == parseInt(pagination[1])){
				dataf = dataTab[tdata[1]].join('');
			}
			else{ return; }
		}
		
		savebase64AsFile(
			cordova.file.cacheDirectory,
			dbgPath(tdata[1]),
			dataf,
			contentType, 
			function(ret){
				loadedFiles = loadedFiles + 1;
				console.log('File loaded '+loadedFiles+'/'+nbFiles+' ('+ret+')');
				if(loadedFiles == nbFiles){
					if(location.href.indexOf(cordova.file.cacheDirectory) !== 0){ 
						listDir(cordova.file.cacheDirectory, function(e){});
						if(navigator.userAgent.indexOf('Android') != -1)
							{
								window.resolveLocalFileSystemURL(cordova.file.cacheDirectory + 'index.html', function success(fileEntry) {
									console.log("got file: " + fileEntry.fullPath);
									console.log('cdvfile URI: ' + fileEntry.toInternalURL());
									$.get(fileEntry.toInternalURL())
										.done(function(ret){
											doc = document.implementation.createHTMLDocument('title');
											doc.documentElement.innerHTML = ret;
											//console.log(doc);
											//console.log(doc.querySelector(".app"));
											document.querySelector(".app").innerHTML=doc.querySelector(".app").innerHTML;
											});
									//document.getElementById(".app").innerHTML='<object type="type/html" data="'+fileEntry.toInternalURL()+'" ></object>';
									//location.href = fileEntry.toInternalURL();
								});
							}
						// else { location.href = cordova.file.applicationDirectory + 'www/index.html'; }
					}
					loadDebug();
				}
			}
		);
	}
	else if(event.data.indexOf('change|') === 0){
		location.reload();
	}
	else if(event.data.indexOf('add|') === 0){
		location.reload();
		
	}
	else if(event.data.indexOf('unlink|') === 0){
		location.reload();
		
	}
}

function loadDebug(){
	console.log("loadDebug();");
	setTimeout("document.querySelector('.app').setAttribute('debug', 'true');", 500);
	document.head.querySelectorAll('base')[0].remove();
	
	
	window.resolveLocalFileSystemURL(cordova.file.cacheDirectory, function success(fileEntry) {
		console.log("got file: " + fileEntry.fullPath);
		console.log('cdvfile URI: ' + fileEntry.toInternalURL());
		
		base = document.createElement('base');
		//base.setAttribute('href', cordova.file.dataDirectory);
		base.setAttribute('href', fileEntry.toInternalURL());
		document.head.appendChild(base);
		
		lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('media', 'all');
		lnk.setAttribute('href', 'css__jquery-ui.css');
		document.getElementsByTagName('head')[0].appendChild(lnk);
		
		lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('media', 'all');
		lnk.setAttribute('href', 'css__jquery-ui.structure.css');
		document.getElementsByTagName('head')[0].appendChild(lnk);
		
		lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('media', 'all');
		lnk.setAttribute('href', 'css__jquery-ui.theme.css');
		document.getElementsByTagName('head')[0].appendChild(lnk);
		
		lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('media', 'all');
		lnk.setAttribute('href', 'css__app.css');
		document.getElementsByTagName('head')[0].appendChild(lnk);
		
		script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', fileEntry.toInternalURL()+'js__jquery-ui.js');
		document.body.appendChild(script);
		
		script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', fileEntry.toInternalURL()+'js__base64.min.js');
		document.body.appendChild(script);
		
		script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', fileEntry.toInternalURL()+'js__crypto.js');
		document.body.appendChild(script);
		
		script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute('src', fileEntry.toInternalURL()+'js__main.js');
		document.body.appendChild(script);
	});
}