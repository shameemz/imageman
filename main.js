var sharp = require('sharp')
var fs = require('fs')
var path = require('path')
var prompt = require('prompt');
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

		console.log(options.configfile);
		var configJson = JSON.parse(fs.readFileSync(options.configfile));
		var config = configJson[options.config];

		var filesToCommit = [];
		config.targets.forEach((target,i) => {
			//console.log('config:',config);
			if(options.outputfilename){
				outFile = options.outputfilename;
			}else
			var outFile = (target.outFilePrefix || '')+path.basename(options.filePath,path.extname(options.filePath))+(target.outFileSuffix || '');
			if(target.outFileFormatLowercase)
				outFile = outFile.toLowerCase();
			if(target.outFileFormatUppercase)
				outFile = outFile.toUpperCase();

			outFile += target.outFileExt

			if(config.root.indexOf('/') !== 0){
				configPath = path.dirname(options.configfile);
				config.root = configPath+'/'+config.root;
			}
			var outputFileName = config.root+'/'+target.outputPath+''+outFile;
			//console.log(outputFileName);
			this.resizeImage({
				filePath: options.filePath,
				targetConfig: target,
				outputRoot: config.root,
				outputFileName: outputFileName

			}, function(err, info){
				if(config.vcs == 'svn'){
					exec('cd '+config.root, (error, stdout, stderr) => {
					  if (error) {
					    console.error(`exec error: ${error}`);
					    return;
					  }
					  	exec('svn add '+outputFileName, (error, stdout, stderr) => {
						  if (error) {
						    //console.error(`exec error: ${error}`);
						    //return;
						  }
						  filesToCommit.push(outputFileName);
						  
						  if(filesToCommit.length == config.targets.length){
						  	commitPrompt();
						  }
						});
						 
					});
					
				}
			})
		});
		function commitAllFiles(){
			var crd = '';
			if(options.username){
				crd = '--username '+username.username+' --password '+options.password+''
			}
			var commit = 'svn commit '+crd+' -m "'+options.commitMessage+'" '+filesToCommit.join(' ');
			//console.log(commit);
			exec(commit, (error, stdout, stderr) => {
					  if (error) {
					  	//console.log(typeof error.message,error.message);
					  	//console.log(typeof stderr)
					    
					    if(error.message.indexOf('Authentication failed') > -1){
						  	commitAuthenticationPrompt();	
						  }
						else console.error(`exec error: ${error}`);
					    return;
					  }
					  //console.log(`stdout: ${stdout}`);
					  //console.log(`stderr: ${stderr}`);

					});
		}
		function commitPrompt(){

			if(options.username && options.password && options.commitMessage){
				 commitAllFiles();
			}else{

				prompt.start();
				console.log("Files ready to commit:\n", filesToCommit.join("\n"));
				prompt.get(commitIntroSchema, function (err, result) {
				    // 
				    // Log the results. 
				    // 
				    if(err || !result)
				    	return ;
				    if(result.commitFlag == '' || result.commitFlag.toLowerCase() == 'yes'){
					    prompt.get(commitMessageSchema, function (err, result) {
						    if(result.commitMessage)
						    	options.commitMessage = result.commitMessage;
						    commitAllFiles();
						});
					    //prompt.stop();
					}else{
						prompt.stop();
					}
				});
			}

			
		}
		function commitAuthenticationPrompt(){
			//prompt.start()
			prompt.get(commitSchema, function (err, result) {
			    // 
			    // Log the results. 
			    // 
			    options.username = result.username;
			    options.password = result.password;
			      commitAllFiles();
				
			});
			
		}
		
	}
}
module.exports = fns;