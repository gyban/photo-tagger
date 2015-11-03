//Add a listener and wait for the device to be ready
document.addEventListener("deviceready", onDeviceReady, false);
//Define a global variable
var image;
//When Cordova API ready
function onDeviceReady() {
    //console.log(navigator.camera);
    //console.log(sqlitePlugin.openDatabase);
    
//Open or create database
    //db = window.sqlitePlugin.openDatabase({name: "my.db" //,androidDatabaseImplementation: 2
	//});
	//console.log(db);
	}
function onSuccess(imageURI) {
    image = document.getElementById("photo");
    image.src = imageURI;
    console.log(imageURI);
	getLocation();
    //Prepare database
	db.transaction(populateDB, errorCB, successCB);
    function populateDB(tx) {
        /*console.log("populateDB started");
        //Create necessary tables
		//tx.executeSql('DROP TABLE IF EXISTS photo');
        tx.executeSql('CREATE TABLE IF NOT EXISTS photo (photo_pk integer primary key asc, photopath text,utctime integer )');
		//tx.executeSql('DROP TABLE IF EXISTS tag');
        tx.executeSql('CREATE TABLE IF NOT EXISTS  tag (tag_pk integer primary key asc, tagname text unique)');
		//tx.executeSql('DROP TABLE IF EXISTS mapper');
        tx.executeSql('CREATE TABLE IF NOT EXISTS mapper (map_id integer primary key asc, tag_fk integer,photo_fk integer, FOREIGN KEY (tag_fk) REFERENCES tag(tag_pk), FOREIGN KEY (photo_fk) REFERENCES photo(photo_pk))');
        console.log("tables created");*/ 
        //Insert the photo path to the photo table
		tx.executeSql('INSERT INTO photo (photopath,utctime) VALUES(?,?)',[imageURI,unixtime] , function (tx, res) {
        console.log("insertId: " +res.insertId+ "" +unixtime);
        //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        });
        //Check rows inserted in a photo table
        tx.executeSql("SELECT count(photo_pk) as cnt FROM photo;", [], function (tx, res) {
        console.log("res.rows.length: " + res.rows.length + " -- should be 1");
        console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
		console.log("populateDB finished");		
        });		
    }
    // Transaction error callback    
    function errorCB(err) {
        alert("Error processing SQL: " + err.message);		
    }

    function successCB() {
        console.log("success in saving photo metadata!");				
    }
	
}

function onFail(message) {
    alert('Failed because: ' + message);
	$textarea.tagEditor('destroy');
	$textarea.empty();
	$textarea.hide();
	
}
// A button will call this function
function getPhoto() {
    // Opens camera and retrieve image
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
		// Hack: switch off in case of android emulator error
        saveToPhotoAlbum: true
    });
}
//Show full sized image 
function showPhoto(source) {
  // Retrieve image file location from specified source
  navigator.camera.getPicture(onPhotoURISuccess, onFail, { quality: 50,
    destinationType: destinationType.FILE_URI,
    sourceType:  Camera.PictureSourceType.SAVEDPHOTOALBUM });
}
function onPhotoURISuccess () {
	alert("You did it!");
}

