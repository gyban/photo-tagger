//Add a listener and wait for the device to be ready
document.addEventListener("deviceready", onDeviceReady, false);
//Define a global variable
var db;
var image;
//When successfull do things
function onDeviceReady() {
    // Now safe to use device APIs
    console.log(navigator.camera);
    //console.log(sqlitePlugin.openDatabase);
    if (!window.sqlitePlugin.openDatabase) {
        alert("SQL database is not supported in this browser!");
    }
//Create database
    db = window.sqlitePlugin.openDatabase({name: "my.db", "bgType":1});
	console.log(db);}

function onSuccess(imageURI) {
    image = document.getElementById("photo");
    image.src = imageURI;
    console.log(imageURI);
	getLocation();
    //Prepare database
	db.transaction(populateDB, errorCB, successCB);
	

    function populateDB(tx) {
        alert("Iam in populateDB");
        //Create necessary tables
        tx.exectuteSql('CREATE TABLE IF NOT EXISTS photo (photo_pk integer primary key, photopath text )');
        tx.exectuteSql('CREATE TABLE IF NOT EXISTS  tag (tag_pk integer primary key, tagname text)');
        tx.exectuteSql('CREATE TABLE IF NOT EXISTS mapper (map_id integer primary key, FOREIGN KEY tag_fk REFERENCES tag(tag_pk), FOREIGN KEY photo_fk REFERENCES photo(photo_pk)');
        console.log("tables created"); 
        //Insert the photo path to the photo table
        tx.exectuteSql('INSERT INTO photo VALUES(?)', [(imageURI).val()], function (tx, res) {
            console.log("insertId: " + res.insertId + " -- probably 1");
            console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        });
        //Check rows inserted in a photo table
        tx.executeSql("SELECT count(photo_pk) as cnt from photo;", [], function (tx, res) {
            console.log("res.rows.length: " + res.rows.length + " -- should be 1");
            console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
        });
    }
    // Transaction error callback    
    function errorCB(err) {
        alert("Error processing SQL: " + err.message);		
    }

    function successCB() {
        console.log("success!");
    }


}

function onFail(message) {
    alert('Failed because: ' + message);
}
// A button will call this function
//
//document.getElementById("button").addEventListener("click", function(){
//    getLocation();
//});
//$("#button").click(onClick);
//var onClick = function () {
//   getPhoto();
//window.location.assign("#detail");
//    remTags();
//    $("textarea").val("");
//};

function getPhoto() {
    // Opens camera and retrieve image
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
        saveToPhotoAlbum: true
    });
}