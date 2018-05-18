# imageman

Imageman is a command line program to resize the images, convert to different formats, copy to different output paths and upload / commit to your svn, git respositories.

##### Background
Whenever you need to resize a bunch of image files and those needs to be copied to different locations under your project folder. 

Imageman uses sharp npm package for resizing images

##### Usage
npm install -g imageman
###### To install using sudo permission
sudo npm install -g imageman --unsafe-perm=true --allow-root

Create a sample.config.json similar to https://github.com/shameemz/imageman/tree/master/example/sample.config.json

cd example/

To process a single image

imageman -c logos -f sample.config.json images/src/KC.png 

To process the entire directory

imageman -c logos -f sample.config.json images/src/

For more details: https://github.com/shameemz/imageman/tree/master/example