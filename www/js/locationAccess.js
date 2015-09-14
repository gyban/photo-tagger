//Taken from the Ben Marshall, http://www.benmarshall.me/reverse-geocoding-html5-google/  and and adjusted by me
function getLocation() {
    //Initialize tagger
    $("#textarea").tagEditor({
        delimiter: ",",
        forceLowercase: false,
        initialTags: []
    });
    //remTags();
    //Check if geolocation is availiable, if yes continue, if not rasie alert
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
}
// Remove all tags
function remTags() {
    var tags = $('#textarea').tagEditor('getTags')[0].tags;
    for (i = 0; i < tags.length; i++) {
        $('textarea').tagEditor('removeTag', tags[i]);
    }
}
//Use google maps API for reverse geocoding adjusted by me
function printAddress(latitude, longitude) {
    //Set up google's geocoder object
    var geocoder = new google.maps.Geocoder();
    //Load GPS coordinates into the object
    var location = new google.maps.LatLng(latitude, longitude);
    //Find address by reverse geocoding
    geocoder.geocode({
        'latLng': location
    }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
                //Split address to logical blocks
                res = results[0].formatted_address.split(",");
                //Fill up the text area with the tags created from the obtained address                    
                $('#textarea').tagEditor('addTag', res[0]);
                $('#textarea').tagEditor('addTag', res[1]);
                $('#textarea').tagEditor('addTag', res[2]);
                $('#textarea').tagEditor('addTag', res[3]);
                saveData(res[0], res[1], res[2], res[3]);
            } else {
                alert("No google address returned");
            }
        } else {
            alert("Reverse Geocoding failed due to: " + status);
        }
    });
}

function saveData(tag1, tag2, tag3, tag4) {
    //Create database
    db = window.sqlitePlugin.openDatabase({
        name: "my.db"
    });
    console.log(db);

    //Prepare database
    db.transaction(populateDB, errorCB, successCB);

    function populateDB(tx) {
        console.log("inserting tags started");
        //Insert the tag to the tag table
        tx.executeSql('INSERT INTO tag (tagname) VALUES(?,?,?,?)', ['+ tag1 +', '+ tag2 +', '+ tag3 +', '+ tag4 +'], function (tx, res) {
            console.log("insertId: " + res.insertId + " -- probably 4");
            console.log("rowsAffected: " + res.rowsAffected + " -- should be 4");
        });
        //Check rows inserted in a tag table
        tx.executeSql("SELECT count(tag_pk) as cnt FROM tag;", [], function (tx, res) {
            console.log("res.rows.length: " + res.rows.length + " -- should be 4");
            console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 4");
        });
        //Find indexes of inserted tags and related photography
        var photoMax = tx.executeSql("SELECT max(photo_pk) as maxim FROM photo;", [], function (tx, res) {
            console.log("res.rows.length: " + res.rows.length + " -- should be 1");
            console.log("res.rows.item(0).cnt: " + res.rows.item(0).maxim + " -- should be 1");
        });
        var tagMax = tx.executeSql("SELECT max(tag_pk) as maxim FROM tag;", [], function (tx, res) {
            console.log("maxId: " + tagMax + " -- should be 4");
            console.log("res.rows.item(0).cnt: " + res.rows.item(0).maxim + " -- should be 1");
        });
        //Create relation between tags and photo by updating mapper table
        for (i = 0; i <= tagMax; i++) {
            var inc = i;
            inc = inc++;
            tx.executeSql('INSERT INTO mapper (tag_fk,photo_fk) VALUES (?,?)', ['+ inc +', '+ photoMax +']);
            console.log(inc);
            console.log("max photo ID: " + photoMax + " --should be 1");
            console.log("inserting tags finished");
        }
        // Transaction error callback    
        function errorCB(err) {
            alert("Error processing SQL: " + err.message);
        }

        function successCB() {
            console.log("success!");
        }
    }
}