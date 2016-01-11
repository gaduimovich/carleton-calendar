# carleton-calendar

Node JS Module  to fetch Calendar from Carleton Central


##What is this?

A Node module that logs in to carleton central and fetches the calendar from the specified semester and year.


## Usage

```javascript
var calendar = require("carleton-calendar");

calendar.getCalendar("Student Number", "Pin", "Semester", "Year", function(object) {
	console.log(object);
});
```





