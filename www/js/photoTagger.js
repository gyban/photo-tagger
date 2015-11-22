/*tagCloud.js, script for building the tag cloud*/
//Add Cordova deviceready listener
document.addEventListener("deviceready", onDeviceReady, false);
var db;
//var $thumbs = $('#thumbs');
//Cordova API ready
function onDeviceReady() {
    if (!window.sqlitePlugin.openDatabase) {
        alert("We are sorry, but SQLite database is not supported by this browser!");
    }
    //Open or create db
    db = window.sqlitePlugin.openDatabase({
        name: "my.db" //,androidDatabaseImplementation: 2
    });
    //Enable foreign keys
    db.executeSql("PRAGMA foreign_keys=true;", [], function (res) {
        db.executeSql("PRAGMA foreign_keys;", [], function (res) {
            console.log("PRAGMA res: " + JSON.stringify(res));
        });
    });
    //Prepare database
    db.transaction(createDB, errorCB, successCB);
    //Create or drop necessary tables, create is enabled by default
    function createDB(tx) {
        console.log("populateDB started");        
        //tx.executeSql('DROP TABLE IF EXISTS photo');
        tx.executeSql('CREATE TABLE IF NOT EXISTS photo (photo_pk integer primary key asc, photopath text,utctime integer)');
        //tx.executeSql('DROP TABLE IF EXISTS tag');
        tx.executeSql('CREATE TABLE IF NOT EXISTS  tag (tag_pk integer primary key asc, tagname text unique)');
        //tx.executeSql('DROP TABLE IF EXISTS mapper');
        tx.executeSql('CREATE TABLE IF NOT EXISTS mapper (map_id integer primary key asc, tag_fk integer,photo_fk integer, FOREIGN KEY (tag_fk) REFERENCES tag(tag_pk), FOREIGN KEY (photo_fk) REFERENCES photo(photo_pk))');
        console.log("tables created");
    }
    //Get tag weight data from db
    var query1 = 'SELECT tag.tag_pk,tag.tagname, COUNT(mapper.tag_fk) AS tagweight FROM tag JOIN mapper ON tag.tag_pk = mapper.tag_fk GROUP BY mapper.tag_fk;';
    queryDb(query1);
	}
//Create html markup for tag cloud dynamically and inject it into the main page
function createTagCloud(tx, res) {
    console.log("I am in a cloud of tags!");
    var len = res.rows.length;
    //Cache most used jquery selectors
    var $tagcloud = $('#tagcloud'),
        $content1 = $('#content1');
    //Check if query returned results, if not inform the user
    if (len === 0) {
        var info = "<p>You do not have any photo labels yet, so, let's start to get some!:)</p>";
        $tagcloud.append(info);
        $content1.trigger("create");
    }
    //Find current min and current max tag weight
    var newMarkup = "",
        scaleUnitLength = 0.00,
        name = "",
        weight = 0,
        scaleValue = 0;
    //Define min and max weight of the tags
    var minWeight = Number.MAX_VALUE;
    var maxWeight = -Math.abs(Number.MAX_VALUE);
    //Define font for photo labels     
    var fontScale = ['s1', 's2', 's3', 's4', 's5', 's6', 's7']; //css font styles for the names of the buttons
    //weight = parseFloat(weight).toFixed(2);
    minWeight = parseFloat(minWeight).toFixed(2);
    console.log("minWeight is: " + minWeight);
    maxWeight = parseFloat(maxWeight).toFixed(2);
    console.log("maxWeight is: " + maxWeight);
    //Find min and max of a value from weight data, then set it
    for (var j = 0; j < len; j++) {
        weight = res.rows.item(j).tagweight;
        console.log("weight decimal is now: " + weight);
        if (weight < minWeight) {
            minWeight = weight;            
        }
        if (weight > maxWeight) {
            maxWeight = weight;            
        }
    }
    //Start creating the tag cloud
    console.log("creating tag cloud started!");
    //Calculate variance, using a font size relative to its place on the scale
    var sd = stddev();
    var squared = [];
    var squaresum = 0.00;
    for (var i = 0; i < len; i++) {
        row = res.rows.item(i).tagweight;
        squaresum += sd(row);
    }
    scaleUnitLength = squaresum / len;
    /*scaleUnitLength = (maxWeight - minWeight + 1) / parseFloat(fontScale.length).toFixed(2); //unit scale length
	scaleUnitLength = scaleUnitLength.toFixed(2);*/
    console.log("scaleUnitLength is: " + scaleUnitLength);
    //Clear tagcloud DOM data if exists from the cache
    $tagcloud.empty();
    //Create named buttons
    var fontsize = "";
    for (var i = 0; i < len; i++) {
		rowid = res.rows.item(i).tag_pk;
        name = res.rows.item(i).tagname;
        weight = res.rows.item(i).tagweight;
        //Calculate scale value of the tag
        scaleValue = parseInt((weight - minWeight) / scaleUnitLength);
        console.log("scaleValue of tag " + name + " is: " + scaleValue);
        //Apply calculated font size
        fontsize = fontScale[scaleValue];
        newMarkup +=
        "<a href='#' id='"+rowid+"' class='"+fontsize+" thumb ui-btn ui-btn-inline' onclick='displayPhoto(this.id);' >"+name+" ("+weight+")</a>";
    }
    $tagcloud.append(newMarkup);	
    $content1.trigger("create");
}
//Display related photos after button click on the tag
function displayPhoto(rowid) {
    //Select photo path,photo time based on suplied tag
    console.log(rowid);
    var tag = rowid;
    var query2 =
        'SELECT photo.photopath,photo.utctime FROM tag LEFT JOIN mapper ON mapper.tag_fk = tag.tag_pk JOIN photo ON photo.photo_pk = mapper.photo_fk WHERE tag.tag_pk=?;';
    queryDb2(query2, tag);
}
//SQL query returning resultset
function queryDb(query, args) {
    db.transaction(makeTx(query, args), errorCB, successCB);

    function makeTx(query, args) {
        return function (tx) {
            tx.executeSql(query, [], createTagCloud, errorCB);
        };
    }
}
//Create thumbnails
function createThumbs(tx, res) {
    console.log("I am in createThumbs!");
    var newMarkup = "";
    var len = res.rows.length;
    var $thumbs = $('#thumbs');
    var $content3 = $('#content3');
    var uri = "";
    var time = 0;
    var d;
	var n;
	var dformat;
	var di;	
	//Clear previous thumbnails (DOM) from the cache
	$thumbs.empty();
    for (var i = 0; i < len; i++) {
        uri = res.rows.item(i).photopath;
        time = res.rows.item(i).utctime;
        d  = new Date(time * 1000);	
		n = d.toLocaleString();		
		newMarkup += "<li><img src="+uri+" class='ui-li-has-thumb'/>"+n+"</li>";
        //$thumbs.append("<li><img src="+uri+" class='ui-li-has-thumb'/>"+n+"</li");
    }
    //Create thumbnails list dynamically
	$thumbs.append(newMarkup);
	//$content3.enhanceWithin();
	$(':mobile-pagecontainer').pagecontainer('change','#photolist');
    //Hack due to html enhancment issues with listview re-generation
	$thumbs.listview({
        autodividers: true,
        autodividersSelector: function (li) {            
			var di = new Date(li.text());
			return di.toLocaleDateString();
        }
    }).listview('refresh');
	//$content3.enhanceWithin();
	$content3.trigger('create');	
	//$.mobile.changePage( "#photolist", { transition: "slideup", changeHash: false });
}
// Transaction error callback    
function errorCB(err) {
    alert("Error processing SQL: " + err.message + "\nCode=" + err.code);
}
//Transaction success callback
function successCB() {
    console.log("db transaction has been successful!");
}
// Calculate standard deviation
function stddev() {
    var n = 0;
    var sum = 0.0;
    var sum_sq = 0.0;
    return function (num) {
        n++;
        sum += num;
        sum_sq += num * num;
        return Math.sqrt((sum_sq / n) - Math.pow(sum / n, 2));
    };
}
//Select all photos related to given tag
function queryDb2(query, args) {
    db.transaction(makeTx(query, args), errorCB, successCB);

    function makeTx(query, args) {
        return function (tx) {
            //alert("SQL query!");
            tx.executeSql(query, [args], createThumbs, errorCB);
        };
    }
}
//Open photo using default app
$(document).on('pagecreate','#photolist',function(){
$('li').on('click',function(){
    var uri = $(this).children('img').attr('src');
	var mime = 'image/jpeg';
	openFile(uri,mime);
});
});
/*cameraAccess.js, script for accessing the camera and saving the tags*/
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
	//$textarea.tagEditor('destroy');
	remTags();
	//$content2.empty();
	$('#btnGroup').hide();
	
}
// A button will call this function
function getPhoto() {
    // Opens camera and retrieve image
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 75,
        destinationType: Camera.DestinationType.FILE_URI,		
        sourceType: Camera.PictureSourceType.CAMERA,
		// Hack: switch off in case of android emulator error
        saveToPhotoAlbum: true
    });
}
//Show full sized image 
function openFile(filePath,fileMIMEType) {
cordova.plugins.fileOpener2.open(
    filePath, 
    fileMIMEType, 
    {
        error : function(){alert('Error status: ' + e.status + ' - Error message: ' + e.message);}, 
        success : function(){ console.log('file opened successfully');  } 
    } 
);
}




