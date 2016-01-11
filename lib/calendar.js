var jsdom = require("jsdom");
var fs = require("fs");
var FileCookieStore = require('tough-cookie-filestore');
var request = require("request");

var LOGIN_URL = 'https://central.carleton.ca/prod/twbkwbis.P_ValLogin';
var VIEW_CALENDAR_URL = 'https://central.carleton.ca/prod/bwskfshd.P_CrseSchdDetl';


if(!fs.existsSync('cookies.json')){
  fs.writeFile('cookies.json', '{}', function (err) {
    if (err) throw err;
  });
}

var j = request.jar(new FileCookieStore('cookies.json'));
request = request.defaults({ jar: j });
j.setCookie(request.cookie('TESTID=set;'), LOGIN_URL);



function getCalendar(semester, year, callback) {
  var term_in = year;

  switch (semester) {
    case "Winter": {
      term_in = term_in.concat("10");
      break;
    }
    case "Summer": {
      term_in = term_in.concat("20");
      break;

    }
    case "Fall": {
      term_in = term_in.concat("30");
      break;
    }
  }

  request.post({ url: VIEW_CALENDAR_URL, form:{ 'term_in': term_in } }, function (err, resp) {
    parseCalendarHTML(resp.body, function(object) {
      callback(object);
    });
  });
}


function loginAndGrabCalendar(StudentNumber, PIN, Semester, Year, object) {
  request.post({
    url: LOGIN_URL,
    form: {
      'sid': StudentNumber,
      'PIN': PIN,
    }},
    function(err, resp, body) {
      getCalendar(Semester, Year, function(calendar) {
        object(calendar)
      });
    }
  );
}


function parseCalendarHTML(html, callback) {
  var objects = {};
  var objects2 = {};


  jsdom.env({
    html: html,
    scripts: ["http://code.jquery.com/jquery.js"],
    done: function (err, window) {
      var $ = window.$;

      var jsonTable = {};


      var classNames = [];
      $("table.datadisplaytable[summary~='schedule course detail']").find("th.ddtitle").each(function() {
        classNames.push($(this).text());
      });
      
      var array = [];
      var array2 = [];

      $("table.datadisplaytable[summary~='schedule course detail']").find('tr').each(function(){
          $(this).children("th.ddlabel").each(function(){
            array.push($(this).text().trim());

          })
      }).end().find('tr').each(function(){
          $(this).children('td.dddefault').each(function(){
            array2.push($(this).text().trim());
            //console.log($(this).text());
          }) 
      })
      
      var lineCount = 0;
      var objCount = 0;
      array.map( function(value, index) {
        jsonTable[value] = array2[index];
        objCount++;
        if (objCount === 8) {
          objects[lineCount] = jsonTable;
          jsonTable = {};
          lineCount++;
          objCount = 0;
        }
      });

      var array3 = [];
      var array4 = [];

      $("table.datadisplaytable[summary~='scheduled meeting times']").find('tr').each(function(){
          $(this).children("th.ddheader").each(function(){
            array3.push($(this).text().trim());
          })
      }).end().find('tr').each(function(){
          $(this).children('td.dddefault').each(function(){
            array4.push($(this).text().trim());
          }) 
      })



      var lineCount = 0;
      var objCount = 0;
      array3.map( function(value, index) {
        jsonTable[value] = array4[index];
        objCount++;
        if (objCount === 7) {
          objects2[classNames[lineCount]] = merge_objects(jsonTable, objects[lineCount]);
          jsonTable = {};
          lineCount++;
          objCount = 0;
        }
      });

      callback(objects2);
    }
  });
}
function merge_objects(object1, object2) {
    var returnVal = {};
    for (var attrname in object1) { 
      returnVal[attrname] = object1[attrname]; 
    }
    for (var attrname in object2) { 
      returnVal[attrname] = object2[attrname]; 
    }
    return returnVal;
}


exports.getCalendar = function getCalendar(StudentNumber, PIN, Semester, Year, callback) {
  loginAndGrabCalendar(StudentNumber, PIN, Semester, Year, function(returnValue) {
    callback(returnValue);
  });
}
