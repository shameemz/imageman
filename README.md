# imageshell

Imageshell is a command line program to resize the images, convert to different formats, copy to different output paths and upload / commit to your svn, git respositories.

Imageshell uses sharp npm package for resizing images

##### Usage
npm install -g imageshell
Create a sample.config similar to https://github.com/shameemz/imageshell/example/sample.config.json
imageshell -c logos -f sample.config.json images/src/KC.png 

For more details: https://github.com/shameemz/imageshell/