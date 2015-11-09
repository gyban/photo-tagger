/*jshint loopfunc: true */
//Declare global variables
var tags;
var $textarea = $('#textarea');
var $content2 = $('#content2');
// Remove all tags from the tag editor's instance
function remTags() {  
  var tags = $('#textarea').tagEditor('getTags')[0].tags;
  var len = tags.length;
if (len !== 'null' | len !=='') {
  for (var i = 0; i < len; i++) {
    $('#textarea').tagEditor('removeTag', tags[i]);
  }
  $('#textarea').tagEditor('destroy');
}
}
//Save photo labels to database
function saveLabels() {	  
  //Create db transaction
  db.transaction(populateDB, errorCB, successCB);
  //Fill tags to global variable  
  tags = $('#textarea').tagEditor('getTags')[0].tags;
  //Insert data, select data from the database
  function populateDB(tx) {
	var len = tags.length;
	if (len == 'null' | len == '') {alert("You don't have any tags! Please add some.");}
    console.log("no. of tags to be inserted: " + len);
    //Insert the tags to the tag table
    for (var i = 0; i < len; i++) {
      var nam = tags[i];
      tx.executeSql('INSERT OR IGNORE INTO tag (tagname) VALUES(?)', [nam],
        function(tx, res) {
          console.log("insertId: " + res.insertId + " tag name: " + nam);          
        });
    }
    //Create relation between tags and photo by updating mapper table
    createMaping(tags,
      'INSERT INTO mapper (tag_fk,photo_fk) SELECT tag_pk,MAX(photo_pk) as maxid FROM tag,photo WHERE tag.tagname=?'
    );
	//Clear tags from DOM cache
	//$textarea.tagEditor('destroy');
	//$content2.empty();
	remTags();
  } // end of populateDB
  // Transaction error callback
  function errorCB(err) {
    alert("Error processing SQL: " + err.message);
  }
//Transaction success callback
  function successCB() {
    console.log("success in saving labels!");     	
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
      return function(tx) {
        tx.executeSql(query, [val], function(tx, res) {
          //console.log("success mapping");
        }, errorCB);
      };
    }
  }
}
//Transaction error callback
function errorCB(err) {
  alert("Error processing SQL: " + err.message);  
}