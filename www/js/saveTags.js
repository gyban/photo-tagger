/*jshint loopfunc: true */
// Remove all tags from the tag editor's instance
function remTags() {
    var tags = $('#textarea').tagEditor('getTags')[0].tags;
    for (i = 0; i < tags.length; i++) {
        $('textarea').tagEditor('removeTag', tags[i]);
    }
}
//
function saveLabels() {
    //Create database
    //db = window.sqlitePlugin.openDatabase({
    //   name: "my.db"
    //});
    console.log(db);
    //Prepare database
    db.transaction(populateDB, errorCB, successCB);

    function populateDB(tx) {
        console.log("inserting tags started");
        console.log("no. of tags to be inserted: " + res.length + "");
        for (i = 0; i < res.length; i++) {
            var index = res[i];
            //Insert the tag to the tag table
            tx.executeSql('INSERT INTO tag (tagname) VALUES(?)', [index], function (tx, result) {
                console.log("insertId: " + result.insertId + " probably " + index + " ");
                console.log("rowsAffected: " + result.rowsAffected + " -- should be 1");
            });
        }
    }

    //Check rows inserted in a tag table
    tx.executeSql("SELECT count(tag_pk) as cnt FROM tag;", [], function (tx, result) {
        console.log("res.rows.length: " + result.rows.length + " -- should be 4");
        console.log("res.rows.item(0).cnt: " + result.rows.item(0).cnt + " -- should be 4");
    });
    //Find indexes of inserted tags and related photography
    photoMax = tx.executeSql("SELECT max(photo_pk) as maxim FROM photo;", [], function (tx, result) {
        console.log("res.rows.length: " + result.rows.length + " -- should be 1");
        console.log("res.rows.item(0).cnt: " + res.rows.item(0).maxim + " -- should be 1");
    });
    tagMax = tx.executeSql("SELECT max(tag_pk) as maxim FROM tag;", [], function (tx, res) {
        console.log("maxId: " + tagMax + " -- should be 4");
        console.log("res.rows.item(0).cnt: " + res.rows.item(0).maxim + " -- should be 1");
    });
    //Create relation between tags and photo by updating mapper table
    for (i = 0; i <= tagMax; i++) {
        var inc = i + 1;        
        tx.executeSql('INSERT INTO mapper (tag_fk,photo_fk) VALUES (?,?)', [inc, photoMax]);
        console.log(inc);
        console.log("max photo ID: " + photoMax + " --should be 1");
        console.log("inserting tags finished");
    }
    // Transaction error callback    
    function errorCB(err) {
        alert("Error processing SQL: " + err.message);
    }

    function successCB() {
        console.log("success in saving labels!");
        // Destroy tag editor's instance if needed
        destroyTagEditor();
    }
	function destroyTagEditor () {
	$('#textarea').val('');	
	}
}