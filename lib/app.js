var express = require('express'),
		fs = require('fs');

function respond(view, req, res, results) {
	if(req.params.format == 'js') {
		res.send(results);
	} else {
		res.render(view, results);
	}
}

if(process.cwd().split('\\').pop() == 'lib'){
    process.chdir('..');
}

process.argv.shift();
process.argv.shift();
home = process.argv.shift() || process.cwd();

var app = express.createServer();
app.use(express.logger());
app.use(express.bodyParser());
app.use(app.router);
app.use("/respect", express.static(process.cwd() + '/public'));

console.log('Respecting ' + home);
eval(fs.readFileSync(home + '/respect.config', encoding="ascii"));

app.get("/respect/list_features.:format?", function(req,res) {
	var specs = require(process.cwd() + '/node_modules/jasmine-node/lib/jasmine-node/spec-collection');
	specs.load(process.cwd() + '/features', new RegExp(".(js)$", "i"));
	var specsList = specs.getSpecs();
	var results = {title:settings.title, features:[]};
  for (var i = 0, len = specsList.length; i < len; ++i) {
	var filename = specsList[i].path().replace(process.cwd() + '/features/','').replace(/.(js)$/,'').replace(/.spec$/,'');
  	results.features.push({name:filename, showUrl:"/respect/show_feature/" + filename});
  }	
	respond('feature/list.jade', req, res, results);
});

app.get("/respect/show_feature/:feature.:format?", function(req, res) {
	var jasmine = require('jasmine-node');
	var jasmineEnv = jasmine.getEnv(), spec = require(process.cwd() + '/features/' + req.params.feature + '.spec.js');
	var specs = jasmineEnv.currentRunner().specs();
	var results = {title:settings.title, feature:req.params.feature, runUrl:'/respect/feature/' + req.params.feature, specs: []}
	for(var i=0; i<specs.length; i++) {
		results.specs.push({description: specs[i].description});
	}
	respond('feature/show.jade', req, res, results);
});

app.post("/respect/feature/:feature.:format?", function(req, res){
	var extensions = 'js';
	var match = '.';
	var junitreport = {
	  	report: false,
	  	savePath : process.cwd() + "/reports/",
	  	useDotNotation: true,
	  	consolidate: true
	}
	var specs = new RegExp(req.params.feature + "spec\\.(" + extensions + ")$", 'i');
	var jasmine = require('jasmine-node');
	jasmine.loadHelpersInFolder(process.cwd() + '/lib/helpers', new RegExp("[-_]helper\\.(" + extensions + ")$"));
	jasmine.loadHelpersInFolder(process.cwd() + '/features', new RegExp("[-_]helper\\.(" + extensions + ")$"));
	jasmine.executeSpecsInFolder(process.cwd() + '/features',
                             function(runner, log){ 
																console.log("Done: " + JSON.stringify(runner.results()));
																if(req.params.format == 'js') {
																	res.send({testResults:runner.results()});
																} else { 
																	res.render('run.jade', {layout:false, testResults:runner.results()});
																}
															},
                             false,
                             false,
                             false,
                             false,
                             specs,
                             junitreport);
});

var port = settings.port || process.env.PORT || 8818;
console.log('Respect server listening on ' + port);
app.listen(port);
