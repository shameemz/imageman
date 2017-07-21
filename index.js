#!/usr/bin/env node
var main = require('./main');

var program = require('commander');


program
.arguments('<file>')
.option('-c, --config <config>', 'config-name')
.option('-f, --configfile <configfile>', 'configfile')
.option('-n, --outputfilename <outputfilename>', 'outputfilename')
.action(function(file) {
//console.log('config: %s file: %s configfile: %s ',    program.config, file);
//console.log(program.outputfilename)
	main.processImage({
		filePath: file,
		config: program.config,
		configfile: program.configfile,
		commitMessage: program.message,
		outputfilename: program.outputfilename
	});
})
.parse(process.argv);