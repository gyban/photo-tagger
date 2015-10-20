//Define global variables
	
//Add Cordova deviceready listener
document.addEventListener("deviceready", onDeviceReady, false);
//Cordova API ready
function onDeviceReady() {
    var query1 = 'SELECT tag.tagname, COUNT(mapper.tag_fk) AS tagweight FROM tag JOIN mapper ON tag.tag_pk = mapper.tag_fk GROUP BY mapper.tag_fk;';
    queryDb(query1);
}
// Test dynamic html markup adding
function test(tx,res) {
		var markup = "";		
		var name = res.rows.item(0).tagname;
			markup += "<a href='#' data-role='button' data-inline='true' onclick='displayPhoto(" + name + ");' id=" + name + ">" + name + "</a>";
			console.log(name);		
		$('#tagcloud').append(markup);
		$("#content1").trigger("create");
	}
//Create tag cloud dynamically and inject it into the main page
function createTagCloud(tx, res) {
    console.log("I am in a cloud of tags!");
    var len = res.rows.length;
    var newMarkup = "";
    var scaleUnitLength;
    var name;
    var weight;
    var scaleValue;
	//Define min and max weight of the tag
	var minWeight = Number.MAX_VALUE;
	console.log("minWeight is: " + minWeight);
	var maxWeight = -Math.abs(Number.MAX_VALUE);
	console.log("maxWeight is: " + maxWeight);
	//Define category weigth for labels
	var fontScale = ["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large"]; //css font styles for the names of the buttons
    if (len == 0) {
        var info = "<p>You do not have any photo labels yet, so, let's start to get some!:)</p?>";
        $('#tagcloud').append(info);
        $("#content1").trigger("create");
    } else {
        //Start creating the tag cloud
        console.log("creating tag cloud started!");
        for (var i = 0; i < len; i++) {
            name = res.rows.item(i).tagname;
            weight = res.rows.item(i).tagweight;
            newMarkup +=
                "<a href='#photolist' data-role='button' data-inline='true' onclick='displayPhoto(" + name + ");' id=" + name + ">" + name + "</a>";
            console.log(name);
            //Parse resultset and set appropriate weight        
            //Find current min and current max tag weight
            weight = parseFloat(weight).toFixed(2);
			minWeight = parseFloat(minWeight).toFixed(2);
			maxWeight = parseFloat(maxWeight).toFixed(2);
            console.log("weight decimal is now: " + weight + "");
            //Find min and max of a value from weight data, then set it
            if (weight < minWeight) {
                minWeight = weight;
            }
            if (weight > maxWeight) {
                maxWeight = weight;
            }
			console.log("minWeight is: " + minWeight);
			console.log("maxWeight is: " + maxWeight);
            //Output each category, using a font size relative to its place on the scale
            scaleUnitLength = (maxWeight - minWeight + 1) / parseFloat(fontScale.length).toFixed(2); //unit scale length
			console.log("scaleUnitLength of the tag " + name + " is: " + scaleUnitLength);
            //Calculate scale value of the tag
            scaleValue = parseInt((weight - minWeight) / scaleUnitLength);
            console.log("scaleValue of tag " + name + " is: " + scaleValue);

            //Apply calculated font size
            //$('#' + name).css('font-size', fontScale[scaleValue]);
            //}
        }
        $('#tagcloud').append(newMarkup);
        $("#content1").trigger("create");
	}
}
//Display related photos after button click on the tag
function displayPhoto(tag) {
    //Select tag and related photos
    var query2 =
        'SELECT photo.photopath FROM tag LEFT JOIN mapper ON mapper.tag_fk = tag.tag_pk JOIN photo ON photo.photo_pk = mapper.photo_fk WHERE tag.tagname=?;';
    var urilinks = queryDbResultset(query2, tag);
    var newMarkup = "";
    for (i = 0; i < urilinks.length; i++) {
        var uri = urilinks[i];
        console.log(uri);
        newMarkup += "<div class='thumbs'><a href=" + uri + "><img src=" + uri +
            "'width:20%;'></img></a></div>";
    }
    $("#photolist").append(newMarkup);
    $("#content3").trigger("create");
}
//SQL query returning resultset
function queryDb(query,args) {
    db.transaction(makeTx(query, args), errorCB, successCB);    
    function makeTx(query, args) {
        return function (tx) {
            tx.executeSql(query,[],createTagCloud, errorCB);
        };
    }
}
// Transaction error callback    
function errorCB(err) {
    alert("Error processing SQL: " + err.message + "\nCode="+err.code);
}
//Transaction success callback
function successCB() {
    console.log("db transaction has been successful!");
}