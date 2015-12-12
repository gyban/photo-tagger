/*jshint loopfunc: true */
//Define a global variables
var image, db, unixtime, utctime, tags, $textarea = $('#textarea'),
    $content2 = $('#content2');
/*tagCloud.js, script for building the tag cloud*/
//Add Cordova deviceready listener
document.addEventListener("deviceready", onDeviceReady, false);
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
    //Cache most used jquery selectors
    var len = res.rows.length,
        $tagcloud = $('#tagcloud'),
        $content1 = $('#content1'),
        info,
        newMarkup = "",
        scaleUnitLength = 0.00,
        name = "",
        weight = 0,
        scaleValue = 0,
        //Define min and max weight of the tags
        minWeight = Number.MAX_VALUE,
        maxWeight = -Math.abs(Number.MAX_VALUE), //Define font for photo labels     
        fontScale = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'], //css font styles for the names of the buttons
        sd = stddev(),
        squaresum = 0.00,
        fontsize = "",
        rowid,
        i;
    //Check if query returned results, if not inform the user
    if (len == 0) {
        info = "<p>You do not have any photo labels yet, so, let's start to get some!:)</p>";
        $tagcloud.append(info);
        $content1.trigger("create");
    }
    //Find current min and current max tag weight		
    //weight = parseFloat(weight).toFixed(2);
    minWeight = parseFloat(minWeight).toFixed(2);
    //console.log("minWeight is: " + minWeight);
    maxWeight = parseFloat(maxWeight).toFixed(2);
    //console.log("maxWeight is: " + maxWeight);
    //Find min and max of a value from weight data, then set it
    for (i = 0; i < len; i++) {
        weight = res.rows.item(i).tagweight;
        //console.log("weight decimal is now: " + weight);
        if (weight < minWeight) {
            minWeight = weight;
        }
        if (weight > maxWeight) {
            maxWeight = weight;
        }
    }
    //Start creating the tag cloud
    //console.log("creating tag cloud started!");
    //Calculate variance, using a font size relative to its place on the scale   
    for (i = 0; i < len; i++) {
        row = res.rows.item(i).tagweight;
        squaresum += sd(row);
    }
    scaleUnitLength = squaresum / len;
    /*scaleUnitLength = (maxWeight - minWeight + 1) / parseFloat(fontScale.length).toFixed(2); //unit scale length
	scaleUnitLength = scaleUnitLength.toFixed(2);*/
    //console.log("scaleUnitLength is: " + scaleUnitLength);
    //Clear tagcloud DOM data if exists from the cache
    $tagcloud.empty();
    //Create named buttons    
    for (i = 0; i < len; i++) {
        rowid = res.rows.item(i).tag_pk;
        name = res.rows.item(i).tagname;
        weight = res.rows.item(i).tagweight;
        //Calculate scale value of the tag
        scaleValue = parseInt((weight - minWeight) / scaleUnitLength);
        //console.log("scaleValue of tag " + name + " is: " + scaleValue);
        //Apply calculated font size
        fontsize = fontScale[scaleValue];
        newMarkup +=
            "<a href='#' id='" + rowid + "' class='" + fontsize + " thumb ui-btn ui-btn-inline' onclick='displayPhoto(this.id);' >" + name + " (" + weight + ")</a>";
    }
    $tagcloud.append(newMarkup);
    $content1.trigger("create");
}
//Display related photos after button click on the tag
function displayPhoto(rowid) {
    //Select photo path,photo time based on suplied tag
    //console.log(rowid);
    var tag = rowid,
        query2 =
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
    //console.log("I am in createThumbs!");
    var newMarkup = "",
        len = res.rows.length,
        $thumbs = $('#thumbs'),
        $content3 = $('#content3'),
        uri = "",
        time = 0,
        d,
        n,
        di,
        i;
    //Clear previous thumbnails (DOM) from the cache
    $thumbs.empty();
    for (i = 0; i < len; i++) {
        uri = res.rows.item(i).photopath;
        time = res.rows.item(i).utctime;
        d = new Date(time * 1000);
        n = d.toLocaleString();
        newMarkup += "<li><img src=" + uri + " class='ui-li-has-thumb'/>" + n + "</li>";
        //$thumbs.append("<li><img src="+uri+" class='ui-li-has-thumb'/>"+n+"</li");
    }
    //Create thumbnails list dynamically
    $thumbs.append(newMarkup);
    //$content3.enhanceWithin();
    $(':mobile-pagecontainer').pagecontainer('change', '#photolist');
    //Hack due to html enhancment issues with listview re-generation
    $thumbs.listview({
        autodividers: true,
        autodividersSelector: function (li) {
            di = new Date(li.text());
            return di.toLocaleDateString();
        }
    }).listview('refresh');
    //$content3.enhanceWithin();
    //$content3.trigger('create');
    $('#photolist').trigger('pagecreate');
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
    var n = 0,
        sum = 0.0,
        sum_sq = 0.0;
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
$(document).on('pagecreate', '#photolist', function () {
    $('li').on('click', function () {
        var uri = $(this).children('img').attr('src'),
            mime = 'image/jpeg';
        openFile(uri, mime);
    });
});
/*cameraAccess.js, script for accessing the camera and saving the tags*/
function onSuccess(imageURI) {
    image = document.getElementById("photo");
    image.src = imageURI;
    //console.log(imageURI);
    getLocation();
    //Prepare database
    db.transaction(populateDB, errorCB, successCB3);

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
        tx.executeSql('INSERT INTO photo (photopath,utctime) VALUES(?,?)', [imageURI, unixtime], function (tx, res) {
            //console.log("insertId: " + res.insertId + "" + unixtime);
            //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        });
        //Check rows inserted in a photo table
        /*tx.executeSql("SELECT count(photo_pk) as cnt FROM photo;", [], function (tx, res) {
            console.log("res.rows.length: " + res.rows.length + " -- should be 1");
            console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
            console.log("populateDB finished");
        });*/
    }
    // Transaction error callback    
    /*function errorCB(err) {
        alert("Error processing SQL: " + err.message);		
    }*/

    function successCB3() {
        console.log("success in saving photo metadata!");
    }

}

function onFail(message) {
    alert('Failed because: ' + message);
    remTags();
    $('#btnGroup').hide();
}
// A button will call this function
function getPhoto() {
    // Opens camera and retrieve image
    navigator.camera.getPicture(onSuccess, onFail, {
        quality: 75,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.CAMERA,
		encodingType: Camera.EncodingType.JPEG,
		//correctOrientation: true,
        // Hack: switch off in case of android emulator error
        saveToPhotoAlbum: true
    });
}
//Show full sized image 
function openFile(filePath, fileMIMEType) {
    cordova.plugins.fileOpener2.open(
    filePath,
    fileMIMEType, {
        error: function () {
            alert('Error status: ' + e.status + ' - Error message: ' + e.message);
        },
        success: function () {
            //console.log('file opened successfully');
        }
    });
}
/*locationAccess.js, script for obtaining the address, via Google's geocoder*/
//Taken from the Ben Marshall, http://www.benmarshall.me/reverse-geocoding-html5-google/  and and adjusted by me
function getLocation() {
    //Get UTC time with time zone			
    utctime = new Date();
    //Get Unix epoch time without miliseconds
    unixtime = Math.floor(Date.parse(utctime) / 1000);
    //Initialize tagger with preffered settings
    $("#textarea").tagEditor({
        initialTags: [],
        maxTags: 50,
        delimiter: ",;",
        placeholder: 'Enter or edit labels ...',
        removeDuplicates: true,
        forceLowercase: false
    });
    //Check if geolocation is availiable, if yes continue, if not rasie an alert
    if (navigator.geolocation) {
        //Obtain position  from the user's browser
        navigator.geolocation.getCurrentPosition(success, error);
    } else {
        alert("Geolocation is not supported in your browser!");
    }
    //If position is successfully obtained callback is performed
    function success(position) {
        printAddress(position.coords.latitude, position.coords.longitude);
    }
    //If there is problem one of the error is raised
    function error(err) {
        switch (err.code) {
            case err.PERMISSION_DENIED:
                alert("Page does not have permission to use the Geolocation API!");
                break;
            case err.POSITION_UNAVAILABLE:
                alert("The position of the device could not be determined!");
                break;
            case err.TIME_OUT:
                alert("Timeout in retrieving the position!");
                break;
            default:
                alert("Unknown error has occured!");
                break;
        }
    }
    //Use google maps API for reverse geocoding adjusted by me
    function printAddress(latitude, longitude) {
        //Set up google's geocoder object and load GPS coordinates into the object
        var geocoder = new google.maps.Geocoder(),
            location = new google.maps.LatLng(latitude, longitude);
        //Find address by reverse geocoding
        geocoder.geocode({
            'latLng': location
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    //Read address as aa string
                    var add = results[0].formatted_address, //Clean address from numbers and other chars
                        reg = /(\\+|\/+|\d|\ - |\ \d|\-\d)/g, //Get Local time
                        localtime = utctime.toLocaleDateString(),
                        geotime;
                    //Create geotime string
                    add += "," + localtime;
                    geotime = add.replace(reg, '');
                    geotime += utctime.getFullYear();
                    console.log(geotime);
                    //Fill up the text area with the tags created from the obtained address				
                    $('#textarea').tagEditor('addTag', geotime);
                } else {
                    alert("No google address returned");
                }
            } else {
                alert("Reverse Geocoding failed due to: " + status);
            }
        });
    }
}
/*saveTags.js, script for saving the tags to database*/
// Remove all tags from the tag editor's instance
function remTags() {
    var tags = $('#textarea').tagEditor('getTags')[0].tags,
        len = tags.length,
        i;
    if (len !=='null' || len !==''|| len!=='undefined') {
        for (i = 0; i < len; i++) {
            $('#textarea').tagEditor('removeTag', tags[i]);
        }
        $('#textarea').tagEditor('destroy');
    }
}
//Clear all tags from the tag editor's instance
function clearTags() {
var tags = $('#textarea').tagEditor('getTags')[0].tags,
        len = tags.length,
        i;
    if (len !=='null' || len !==''|| len!=='undefined') {
        for (i = 0; i < len; i++) {
            $('#textarea').tagEditor('removeTag', tags[i]);
        }
    }
}
//Save photo labels to database
function saveLabels() {
    //Create db transaction
    db.transaction(populateDB, errorCB, successCB2);
    //Fill tags to global variable  
    tags = $('#textarea').tagEditor('getTags')[0].tags;
    //Insert data, select data from the database
    function populateDB(tx) {
        var len = tags.length,
            i,
            nam;
        if (len =='null' || len =='' || len =='undefined') {
            alert("You don't have any tags! Please add some.");
        }
        //console.log("no. of tags to be inserted: " + len);
        //Insert the tags to the tag table
        for (i = 0; i < len; i++) {
            nam = tags[i];
            tx.executeSql('INSERT OR IGNORE INTO tag (tagname) VALUES(?)', [nam],

            function (tx, res) {
                console.log("insertId: " + res.insertId + " tag name: " + nam);
            });
        }
        //Create relation between tags and photo by updating mapper table
        createMaping(tags,
            'INSERT INTO mapper (tag_fk,photo_fk) SELECT tag_pk,MAX(photo_pk) as maxid FROM tag,photo WHERE tag.tagname=?');
        //Clear tags from DOM cache
        //$textarea.tagEditor('destroy');
        //$content2.empty();
        remTags();
    } // end of populateDB
    // Transaction error callback
    /*function errorCB(err) {
    alert("Error processing SQL: " + err.message);
  }*/
    //Transaction success callback
    function successCB2() {
        //console.log("success in saving labels!");    	
        getPhoto();
        var query1 = 'SELECT tag.tagname, COUNT(mapper.tag_fk) AS tagweight FROM tag JOIN mapper ON tag.tag_pk = mapper.tag_fk GROUP BY mapper.tag_fk;';
        queryDb(query1);
        // Clear tags and destroy tag editor's instance
        remTags();
        //$('#textarea').tagEditor('destroy');
    }
    //Save both tag and photo to mapping table
    function createMaping(tags, query) {
        for (var i = 0; i < tags.length; i++) {
            db.transaction(makeTx(tags[i], query), errorCB);
        } //end for call
        function makeTx(val, query) {
            return function (tx) {
                tx.executeSql(query, [val], function (tx, res) {
                    //console.log("success mapping");
                }, errorCB);
            };
        }
    }
}
//Transaction error callback
/*function errorCB(err) {
    alert("Error processing SQL: " + err.message);
}*/