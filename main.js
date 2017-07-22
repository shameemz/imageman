var sharp = require('sharp')
var fs = require('fs')
var path = require('path')
var prompt = require('prompt');
var async = require('async');
const { exec } = require('child_process');

var commitIntroSchema = {
    properties: {
      commitFlag: {
      	description: 'Do you want to commit your changes? [yes/no]',
        message: '[yes/no]',
        required: true
      }
    }
  };
  var commitMessageSchema = {
    properties: {
      commitMessage: {
      	description: 'Commit Message',
        required: true
      }
    }
  };
  var commitSchema = {
    properties: {
      username: {
        description: 'Username',
        required: true
      },
      password: {
      	description: 'Password',
        hidden: true,
        required: true
      }
    }
  };
var fns = {
	resizeImage: function(options, callback){
		sharp(options.filePath)
		  .resize(options.targetConfig.size.width , options.targetConfig.size.height)
		  .max()
		  .toFile(options.outputFileName, (err, info) => {
		  	if(err) console.log(err);
		  	callback(err, info)
		  })
		  //.catch( err => console.log(err) );
	},
	processImage: function(options){
		if(options.verbose)
			console.log(options.configfile);
		var configJson = JSON.parse(fs.readFileSync(options.configfile));
		var config = configJson[options.config];
		var that = this;
		//var filesToCommit = [];
		if(config.root.indexOf('/') !== 0){
				configPath = path.dirname(options.configfile);
				config.root = configPath+'/'+config.root;
		}
		function processTargets(filePath, callback){

			function processEachTarget(target, cb){
				if(options.outputfilename){
					var outFileTmp = options.outputfilename;
				}else
					var outFileTmp = path.basename(filePath, path.extname(filePath));

				if(target.outFileFormatLowercase)
					outFileTmp = outFileTmp.toLowerCase();
				if(target.outFileFormatUppercase)
					outFileTmp = outFileTmp.toUpperCase();

				 outFile = (target.outFilePrefix || '')+
				 outFileTmp
				 +(target.outFileSuffix || '');

				outFile += target.outFileExt;
				
				var outputFileName = config.root+'/'+target.outputPath+''+outFile;
				//console.log(outputFileName);
				that.resizeImage({
					filePath: filePath,
					targetConfig: target,
					outputRoot: config.root,
					outputFileName: outputFileName

				}, function(err, info){
					if(!err){
						info = outputFileName;
					}
					cb(err, info);
				})
			}
			var fnTargets = [];
			config.targets.forEach((target,i) => {
				fnTargets.push(function(cb){
					processEachTarget(target, cb);
				});
			});
			async.parallel(fnTargets, (err, data) => {
				callback(err, data);
			});
		}
		
		var stats = fs.stat(options.filePath, (err, stats) => {
			
			if(stats.isDirectory()){
				var dirs = fs.readdirSync(options.filePath);
				
				var fns = []
				dirs.forEach(function(file){
					fns.push(function(cb){
						processTargets(options.filePath+file, (err, data) => {
							cb(err, data);	
						});
					})
				});
				async.parallel(fns, function(err, data){
					if(err)
						return console.error(err)
					filesToCommit = [].concat.apply([], data);
					
					commitPrompt(filesToCommit);
				});
			}else{
				processTargets(options.filePath, (err, filesToCommit) => {
					if(err)
						return console.error(err)
					
					commitPrompt(filesToCommit);
				});
			}
		});
		

		
		function commitAllFiles(filesToCommit){

			var crd = '';
			config.vcs = config.vcs.toLowerCase();
			if(options.username && config.vcs == 'svn'){
				crd = '--username '+options.username+' --password '+options.password+''
			}
			var commit = config.vcs+' commit '+crd+' -m "'+options.commitMessage+'" '+(config.vcs == 'svn' ? filesToCommit.join(' ') : '');
			var vcsAdd = config.vcs+' add '+filesToCommit.join(' ');
			
			exec('cd '+config.root, (error, stdout, stderr) => {
						  if (error) {
						    console.error(`exec error: ${error}`);
						    return;
						  }
						  	
				 	//filesToCommit.push(outputFileName);
					
				exec(vcsAdd, (error, stdout, stderr) => {
						  if (error) {
						    console.error(`exec error: ${error}`);
						    //return;
						  }

					exec(commit, (error, stdout, stderr) => {
							  if (error) {
							  	
							    if(error.message.indexOf('Authentication failed') > -1){
								  	commitAuthenticationPrompt();	
								  }
								else 
									{
										return console.error(`exec error: ${error}`, stdout);
									}
								
							    return;
							  }
							  console.log("File(s) successfully committed.\n");

							  if(config.vcs == 'git'){
							  	exec('git branch', (error, stdout, stderr) => {
									  if (error) {
									  	console.error(`exec error: ${error}`);
									  	return;
									  }
									  var branch = stdout.split(' ').pop();
									  if(branch){
									  	exec('git push -u origin '+branch, (error, stdout, stderr) => {
											  if (error) {
											  	console.error(`exec error: ${error}`);
											  	return;
											  }
											  console.log("\nFile(s) successfully pushed to the branch:"+branch);
										});
									  }
								});
							  }
							  

							});
			});
		});
		}
		function commitPrompt(filesToCommit){
			if(!config.vcs){
				console.log('All images resized.');
				return false;//console.log('All images resized');
			}

			console.log("Files ready to commit:\n", filesToCommit.join("\n"));
				
			if((options.username && options.password && config.vcs == 'svn' || config.vcs == 'git') && options.commitMessage){
				 commitAllFiles(filesToCommit);
			}else{

				prompt.start();
				prompt.get(commitIntroSchema, function (err, result) {
				    // 
				    // Log the results. 
				    // 
				    if(err || !result)
				    	return ;
				    if(result.commitFlag == '' || result.commitFlag.toLowerCase() == 'yes' || result.commitFlag.toLowerCase() == 'y'){
				    	if(!options.commitMessage)
						    prompt.get(commitMessageSchema, function (err, result) {
						    	if(err || !result)
					    			return ;
							    if(result.commitMessage)
							    	options.commitMessage = result.commitMessage;
							    commitAllFiles(filesToCommit);
							});
						else
							commitAllFiles(filesToCommit);
					    //prompt.stop();
					}else{
						prompt.stop();
					}
				});
			}

			
		}
		function commitAuthenticationPrompt(filesToCommit){
			//prompt.start()
			if(options.username){
					delete commitIntroSchema.properties.username;
					commitIntroSchema.properties.password.description = 'Enter the passowrd for '+options.username
			}
			prompt.get(commitSchema, function (err, result) {
			    // 
			    // Log the results. 
			    // 
			    if(result.username)
			    options.username = result.username;
			    
			    options.password = result.password;
			      commitAllFiles(filesToCommit);
				
			});
			
		}
		
	}
}
module.exports = fns;