/*jshint loopfunc: true */
//Declare global variables
var tags;
var maxPhoto;
var maxTag;
var minTag;
// Remove all tags from the tag editor's instance
function remTags() {
  for (i = 0; i < tags.length; i++) {
    $('textarea')
      .tagEditor('removeTag', tags[i]);
  }
}
//Save labels to database
function saveLabels() {
  //Fill tags to global variable  
  tags = $('#textarea')
    .tagEditor('getTags')[0].tags;
  //Create db transaction
  db.transaction(populateDB, errorCB, successCB);
  //Insert data, select data from the database
  function populateDB(tx) {
    console.log("inserting tags started");
    console.log("no. of tags to be inserted: " + tags.length + "");
    //Insert the tags to the tag table
    for (i = 0; i < tags.length; i++) {
      var nam = tags[i];
      tx.executeSql('INSERT OR IGNORE INTO tag (tagname) VALUES(?)', [nam],
        function(tx, res) {
          console.log("insertId: " + res.insertId + " tag name: " + nam + "");
          //console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");
        });
    }
    //Check rows inserted in a tag table
    tx.executeSql("SELECT count(tag_pk) as cnt FROM tag;", [], function(tx, res) {
      console.log("res.rows.length: " + res.rows.length + " -- should be 4");
      console.log("res.rows.item(0).cnt: " + res.rows.item(0)
        .cnt + " -- should be 4");
    });
    //Find indexes of inserted tags and related photography
    tx.executeSql("SELECT max(photo_pk) as maxim FROM photo;", [], function(tx,
      res) {
      maxPhoto = res.rows.item(0)
        .maxim;
      console.log("maxPhoto: " + maxPhoto + " -- should be 1");
      console.log("res.rows.item(0).cnt: " + res.rows.item(0)
        .maxim + " -- should be 1");
    });
    tx.executeSql("SELECT max(tag_pk) as maxim FROM tag;", [], function(tx, res) {
      maxTag = res.rows.item(0)
        .maxim;
      console.log("maxTag: " + maxTag + " -- should be 4");
      console.log("res.rows.item(0).cnt: " + res.rows.item(0)
        .maxim + " -- should be 1");
    });
    //Create relation between tags and photo by updating mapper table
    createMaping(tags,
      'INSERT INTO mapper (tag_fk,photo_fk) SELECT tag_pk,MAX(photo_pk) as maxid FROM tag,photo WHERE tag.tagname=?'
    );
  } // end of populateDB
  // Transaction error callback
  function errorCB(err) {
    alert("Error processing SQL: " + err.message);
  }
//Transaction success callback
  function successCB() {
    console.log("success in saving labels!");
    // Destroy tag editor's instance if needed
    remTags();
    getPhoto();
  }


  function destroyTagEditor() {
    $('#textarea')
      .val('');
  }

  function createMaping(tags, query) {
    for (i = 0; i < tags.length; i++) {
      db.transaction(makeTx(tags[i], query), errorCB);
      //console.log("tag ID: " + i + " photo ID: " + maxPhoto + "");
    } //end for call
    function makeTx(val, query) {
      return function(tx) {
        tx.executeSql(query, [val], function(tx, res) {
          //console.log("success mapping");
        }, errorCB);
      };
    }
  }
}

function errorCB(err) {
  alert("Error processing SQL: " + err.message);
}