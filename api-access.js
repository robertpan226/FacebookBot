var uwaterlooApi = require('uwaterloo-api');
var uwclient = new uwaterlooApi({
	API_KEY : "2c05f4d312462543d7998f25f4eb9bb6"
})

//module.exports = {
		getTerm = function(callback){
		uwclient.get('terms/list', {}, function(err, res){
			callback(res["data"]["current_term"]);
		});
  }
    validCourse = function(callback){
    uwclient.get('/courses', {}, function(err, res){
      callback(res);
    });
	}
//};

validCourse(function(x){
  for (var i = 0; i < x["data"].length; i++){
      if ("CS" == x["data"][i]["subject"] && "135" == x["data"][i]["catalog_number"]){
        console.log("hello");
      }   
  }
});