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
                var res = results[0].formatted_address.split(",");
                //Fill up the text area with the tags created from the obtained address                    
                $('#textarea').tagEditor('addTag', res[0]);
                $('#textarea').tagEditor('addTag', res[1]);
                $('#textarea').tagEditor('addTag', res[2]);
                $('#textarea').tagEditor('addTag', res[3]);
            } else {
                alert("No google address returned");
            }
        } else {
            alert("Reverse Geocoding failed due to: " + status);
        }
    });
}