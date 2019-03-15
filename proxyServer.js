// ╔═══════════════════════════════════════════════════════════════╗
// ║ ------------ League of Legends API Proxy Server ------------- ║
// ╠═══════════════════════════════════════════════════════════════╣
// ║                                                               ║
// ║  Author: Graham Wilson                                        ║
// ║  Last Updated: March 15, 2019                                 ║
// ║                                                               ║
// ║  Description:                                                 ║
// ║    This file is the main proxy server for the League of       ║
// ║    Legends API. It takes requests through specific url        ║
// ║    routes with parameters. It takes these requests, formats   ║
// ║    them to follow the Riot API specifications and adds the    ║
// ║    Riot API Key assigned to this application before           ║
// ║    forwarding it to the API. It also ensures that rate the    ║
// ║    rate limits are never exceeded.                            ║
// ║                                                               ║
// ║  How To Use:                                                  ║
// ║    You can access the statistics directly by entering the     ║
// ║    URL of the website this program is running on, followed    ║
// ║    by '/api/{route}'. Or you can use the JS request package   ║
// ║    to get the data from this server. Either way, the proxy    ║
// ║    server will return a JSON formatted object containing      ║
// ║    the requested information.                                 ║
// ║                                                               ║
// ║  Available Routes:                                            ║
// ║    '/api/updateSum/:sumName'                                  ║
// ║    '/api/getSumId/:sumName'                                   ║
// ║    '/api/getSumName/:sumId'                                   ║
// ║    '/api/getSumName/:sumId'                                   ║
// ║    '/api/getMasteriesById/:id'                                ║
// ║    '/api/champInfo/:champName'                                ║
// ║    '/api/champRandom'                                         ║
// ║                                                               ║
// ╚═══════════════════════════════════════════════════════════════╝

// Required Packages
const express = require('express');
const dataService = require('./data-service');
const app = express();
const router = express.Router();

// Stores the API key for this specific application
var RGAPI_Key = '';

// Router middleware to ensure rate limiting policies are followed
router.use(dataService.rateLimiting);

// ========= ROUTES =========

// Route that force updates the requested summoner
router.route('/updateSum/:sumName').get(function(req, res) {
    // If rate limit is not exceeded
    if (req.canRequest){
        console.log('===================');
        console.log('[ CONNECTION ] A connection to request to update a summoner recieved');
        var name = req.params.sumName; // Summoner to update
        dataService.updateSummonerByName(name, RGAPI_Key).then((data) => { // Request summoner data from Riot API
            console.log('[ RESPONDING ] Summoner has been successfully updated');
            res.json({"result":"success"});
        }).catch((err) => {
            console.log('[ ERROR ] Could not return a summoner id by name');
            res.json({"result":"fail"});
        });
    } else {
        res.json({'Error': 'Rate Limit Reached'});
    }
});

// Route that sends back the summoner ID related to the requested summoner name
router.route('/getSumId/:sumName').get(function(req, res) {
    // If rate limit is not exceeded
    if (req.canRequest){
        console.log('===================');
        console.log('[ CONNECTION ] A connection to request a summoners ID recieved');
        var name = req.params.sumName; // Summoner name
        dataService.getSummonerIdByName(name, RGAPI_Key).then((data) => { // Request summoner ID by name from Riot API
            res.json({"summonerId": data});
        }).catch((err) => {
            console.log('[ ERROR ] Could not return a summoner id by name');
            res.json({"result":"fail"});
        });
    } else {
        res.json({'Error': 'Rate Limit Reached'});
    }
});

// Route that sends back the summoner name related to the requested summoner ID
router.route('/getSumName/:sumId').get(function(req, res) {
    // If rate limit is not exceeded
    if (req.canRequest){
        console.log('===================');
        console.log('[ CONNECTION ] A connection to request a summoners name recieved');
        var id = req.params.sumId; // Summoner ID
        dataService.getSummonerNameById(id, RGAPI_Key).then((data) => { // Request summoner name by ID from Riot API
            res.json({"summonerName": data});
        }).catch((err) => {
            console.log('[ ERROR ] Could not return a summoner name by id');
            res.json({"result":"fail"});
        });
    } else {
        res.json({'Error': 'Rate Limit Reached'});
    }
});

// Route that sends back all the champion masteries for the requested summoner ID
router.route('/getMasteriesById/:id').get(function(req, res) {
    // If rate limit is not exceeded
    if (req.canRequest){
        console.log('===================');
        console.log('[ CONNECTION ] A connection to request a summoners masteries recieved');
        var sumId = req.params.id; // Summoner ID
        dataService.getMasteriesByID(sumId, RGAPI_Key).then((masteryData) => { // Request champion masteries by summoner ID from Riot API
            console.log('[ RESPONDING ] All champion masteries for the summoner sent to client');
            res.json(masteryData);
        }).catch((err) => {
            console.log('[ ERROR ] Could not return summoners champion masteries');
            res.json({'fail':'fail'});
        });
    } else {
        res.json({'Error': 'Rate Limit Reached'});
    }
});

// Route that sends back all the general info for the requested champion
router.route('/champInfo/:champName').get(function(req, res) {
    console.log('===================');
    console.log('[ CONNECTION ] A connection to request a champions info recieved');
    var name = req.params.champName; // Requested champion
    var champ = dataService.getChampInfo(name); // Champions data
    console.log('[ RESPONDING ] Info on the requested champion has been sent to the client');
    res.json(champ);
});

// Route that sends back the name of a random champion
router.route('/champRandom').get(function(req, res) {
    console.log('===================');
    console.log('[ CONNECTION ] A connection to request a random champion recieved');
    var champ = dataService.getRandomChamp(); // Name of a random champion
    res.json(champ);
});

// Have the route use the '/api' path
app.use('/api', router);

// Calls the initialize function to set up the server
dataService.initialize().then((data) => {
    // Split the data to proper variables
    hosting = data.hosting;
    api_keys = data.API_Keys;

    // If initialization resolved then start the server
    var server = app.listen(process.env.PORT || hosting.port, function () {
        console.log('[ LOADED ] RGAPI Key has been loaded');
        console.log(`[ ONLINE ] Server running at http://${hosting.hostname}:${hosting.port}/`);
        RGAPI_Key = api_keys.RGAPI;
    })
}).catch((err) => {
    console.log('[ FAILURE ] Failed to start the server: ' + err);
});