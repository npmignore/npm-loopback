'use strict';

const express = require('express');
const request = require('request');
const morgan = require('morgan');

let app = express();

app.use(morgan('short'));

function maskVersion(version){
    // Replace the url so downloading a package also hits our server
    version.dist.tarball = version.dist.tarball
        .replace('https://registry.npmjs.org', 'http://localhost:3000');
    return version;
}

function mask(obj) {
    Object.keys(obj.versions).forEach(key => {
        obj.versions[key] = maskVersion(obj.versions[key]);
    });
    return obj;
}

function getMetadata(name) {
    return new Promise((resolve, reject) => {
        request(`https://registry.npmjs.org/${name}`, function (err, response, body) {
            //Error so reject
            if(err) { reject(err); return; }

            let data = JSON.parse(body);
            resolve(mask(data));
        });
    });
}

//Morgan only logs the request once it is complete
//this logs the start of the request
// app.get('*', function (req, res, next) {
//     console.log(req.path);
//     next();
// });
const cachedResponses = {};

app.get('/:name', function (req, res) {
    console.log(req.path);
    if (req.path in cachedResponses) {
      console.log(`I already got that ${req.path}!!!!!`);
      res.sendStatus(304);
    } else {
      getMetadata(req.params.name).then(data => res.json(data));
    }
    cachedResponses[req.path] = res;
});

app.get('*', function (req, res) {
    request
        .get(`https://registry.npmjs.org${req.path}`)
        .pipe(res);
});

app.listen(3000);
