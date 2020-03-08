# Yanadu - Meet and talk with colleagues in virtual 3D Office rooms


What is the big advantage of business trips compared to phone or video calls inside an organisation? On a (video) call, you normally talk only to the person(s) you've called, while on a business trip you've a lot of side chats with all your other friends you meet in the office or in the cafeteria. 


To support this, Yanada allows you to talk to everybody who is around in a (virtual) office without the nessecarity to physically travel to that office first - instead you just start up your browser and go into the other office.

The key features of Yanadu are

 - you can talk to everybody just by go near to him/her just like in normal life
 - it provides 3D office room environments which can be layouted to look simular  to the real offices


## Server Hopping
In opposite to simular solutions, Yanadu provides the principle of multiple servers, so there's no need to maintain the whole organisation on a single system. Instead each department can set up it's own server just showing their own environment. 

Yanadu then allows the user to jump from one server to another, means go from one office location to another


## Project Status

Yanadu is actual in an early alpha-proof-of-concept state just to get the basic functionalities up and running






## Installation
1. Clone the repo, e.g ```git clone https://github.com/stko/Yanadu.git```
1. Run ```npm install``` to install all the dependencies

## Usage
Use ```npm run start``` to start the server and bundler


The start script launches:
- ```nodemon``` Which restarts the server on every change (port: 1989)
- ```watchify``` Which bundles the client code from ```src/``` on every change to ```./public/js/bundle.js```



You can also run ```npm run build``` to bundle and minify the client code to ```./public/js/bundle.min.js```

Browserify is setup to transform both ES6 Javascript and ```glslify``` for GLSL shader bundling ([example](https://github.com/juniorxsound/DepthKit.js) of a project that uses ```glslify```)


## Credits
Build system and basic 3D routines from [https://github.com/juniorxsound/THREE-Multiplayer/](https://github.com/juniorxsound/THREE-Multiplayer/)

Room layout and first furnitures are taken from [https://github.com/furnishup/blueprint3d](https://github.com/furnishup/blueprint3d)

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

