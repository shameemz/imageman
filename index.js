#!/usr/bin/env node
var main = require('./main');

var program = require('commander');


program
.arguments('<file>')
.option('-c, --config <config>', 'config-name')
.option('-f, --configfile <configfile>', 'configfile')
.option('-m, --commitMessage <commitMessage>', 'commitMessage')
.option('-n, --outputfilename <outputfilename>', 'outputfilename')
.option('-u, --username <username>', 'username')
.option('-p, --password <password>', 'password')
.action(function(file) {

	main.processImage({
		filePath: file,
		config: program.config,
		configfile: program.configfile,
		commitMessage: program.commitMessage,
		username: program.username,
		password: program.password,
		outputfilename: program.outputfilename
	});
})
.parse(process.argv);