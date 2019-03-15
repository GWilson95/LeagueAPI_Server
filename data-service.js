// Required packages
const fs = require('fs');
const request = require('request');

// Holds locally stored data for summoners, game versions, and champions
var leagueData = readFileJSON('./data/summoners.json', 'Summoners');
var versions;
var champions;

//  Holds header of last request for RATE LIMITING
var lastHeader = {};

// List of riot api links
const API_URLs = { 
    "summByName": "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/{summonerName}",
    "masteryByID": "https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/{summonerID}",
    "summByID": "https://na1.api.riotgames.com/lol/summoner/v4/summoners/{summonerID}",
    "dd_versions": "https://ddragon.leagueoflegends.com/api/versions.json",
    "dd_champs": "https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json"
}

// Initialize the server by reading in values from the config file
exports.initialize = function() {
    return new Promise((resolve, reject) => {
        // Read in the server IP/Port and the Riot API key
        var configJSON = readFileJSON('./data/config/config.json', 'Config'); 
        // Download versions JSON from league of legends API and check for updates
        getLatestVersionData().then((retData) => {
            versions = retData['version'];
            // If version was updated, download new champion data, otherwise use locally stored data
            getLatestChampionData(retData['updated']).then((champData) => {
                champions = champData;
                resolve(configJSON);
            }).catch(() => {
                resolve(configJSON);
            });
        }).catch((err) => {
            resolve(configJSON);
        });
    });
};

// Takes a name of a summoner and the api key
// Downloads most recent version of summoner, adding it to the json list if its new, updating if summoner already exists
exports.updateSummonerByName = function(name, key){
    return new Promise((resolve, reject) => {
        // Construct the Riot API url
        var url = API_URLs["summByName"].replace('{summonerName}', name);
        url += '?api_key=' + key;

        console.log('[ REQUESTING ] Requesting summoner data from Riot API');
        console.log('[ -> API_URL ] https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + name);
         // Call function to send request to Riot API and return JSON obj
        sendRequest(url).then((summData) => {
            console.log('[ RECIEVED ] ' + summData.name + ' is level ' + summData.summonerLevel + ' and has an id of ' + summData.id);
            // Check if summoner doesnt exist (add them if they dont)
            if (!updateSummonerObj(summData)){ 
                console.log('[ DATA ADDED ] Adding new summoner');
                leagueData.summoners.push(summData);
            } else { // If they already exist
                console.log('[ DATA UPDATED ] Updated an existing summoner');
            }
            // Save the changes to the local file
            writeFileJSON('./data/summoners.json', leagueData, 'summoners');
            resolve(summData);
        }).catch((err) => {
            reject();
        });
    });
}

// Takes a name of a summoner and the api key
// Returns the ID of the summoner, checking locally first and if not found then downloads a recent version of summoner
exports.getSummonerIdByName = function(name, key) {
    return new Promise((resolve, reject) => {
        console.log('[ NOTE ] Getting summoners ID by name');
        // Get value of locally stored summoner and return it if found
        var summId = checkSummonerExistsName_getID(name);
        if (summId != false){
            console.log('[ NOTE ] Summoner found');
            resolve(summId);
        } else { // Otherwise download summoner and return ID
            // Construct Riot API url
            var url = API_URLs["summByName"].replace('{summonerName}', name);
            url += '?api_key=' + key;

            console.log('[ NOTE ] Summoner not found');
            console.log('[ REQUESTING ] Requesting Riot API for new summoner');
            // Call function to send request to Riot API and return JSON obj
            sendRequest(url).then((summData) => { 
                console.log('[ RECIEVED ] ' + summData.name + ' is level ' + summData.summonerLevel + ' and has an id of ' + summData.id);
                // Check if summoner doesnt exist (add them if they dont)
                if (!updateSummonerObj(summData)){ 
                    console.log('[ DATA ADDED ] Adding new summoner');
                    leagueData.summoners.push(summData);
                } else { // If they already exist
                    console.log('[ DATA UPDATED ] Updated an existing summoner');
                }
                // Write changes to the summoner file
                writeFileJSON('./data/summoners.json', leagueData, 'summoners');
                resolve(summData.id);
            }).catch((err) => {
                reject('Summoner does not exist');
            });
        }
    });
};

// Takes a ID of a summoner and the api key
// Returns the name of the summoner, checking locally first and if not found then downloads a recent version of summoner
exports.getSummonerNameById = function(id, key) {
    return new Promise((resolve, reject) => {
        console.log('[ NOTE ] Getting summoners name by ID');
        // Checks if summoner already exists and returns name if it does
        var summName = checkSummonerExistsID_getName(id);
        if (summName != false){
            console.log('[ NOTE ] Summoner found' + summName);
            resolve(summName);
        } else { // Otherwise download the summoner and return the name
            // Construct the Riot API url
            var url = API_URLs["summByID"].replace('{summonerID}', id);
            url += '?api_key=' + key;

            console.log('[ NOTE ] Summoner not found');
            console.log('[ REQUESTING ] Requesting Riot API for new summoner')
            console.log('[ -> API_URL ] https://na1.api.riotgames.com/lol/summoner/v4/summoners/' + id);
            // Call function to send request to Riot API and return JSON obj
            sendRequest(url).then((summData) => { 
                console.log('[ RECIEVED ] ' + summData.name + ' is level ' + summData.summonerLevel + ' and has an id of ' + summData.id);
                // Check if summoner doesnt exist (add them if they dont)
                if (!updateSummonerObj(summData)){ 
                    console.log('[ DATA ADDED ] Adding new summoner');
                    leagueData.summoners.push(summData);
                } else { // If they already exist
                    console.log('[ DATA UPDATED ] Updated an existing summoner');
                }
                // Write changes to the summoner file
                writeFileJSON('./data/summoners.json', leagueData, 'summoners');
                resolve(summData.name);
            }).catch((err) => {
                reject();
            });
        }
    });
};

// Takes a summoner ID and the api key
// Returns a list of masteries for all champions for that summoner ID
exports.getMasteriesByID = function(id, key) {
    return new Promise((resolve, reject) => {
        // Construct Riot API url
        var url = API_URLs["masteryByID"].replace('{summonerID}', id);
        url += '?api_key=' + key;

        console.log('[ REQUESTING ] Request recieved for summoners champion masteries');
        console.log('[ -> API_URL ] https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + id);
        // Request champion mastery data from Riot API
        sendRequest(url).then((masteryData) => {
            console.log('[ RECIEVED ] Summoners champions masteries successfully recieved');
            var name = checkSummonerExistsID_getName(id);
            var champName;
            // For each champion ID in the list, get the name and add it to the same object
            for (var c in masteryData){
                champName = getChampNameByID(masteryData[c].championId)
                masteryData[c]['championName'] = champName;
            }
            resolve({"name": name, "data": masteryData});
        }).catch((err) => {
            reject();
        });
    });
};

// Takes the name of a champion
// Returns an object containing all general stats on that champion
exports.getChampInfo = function(name) {
    name = name.toLowerCase().replace(/ /g, '');
    // Search for matching champion in list
    for (var c in champions.data){
        if (c.toLowerCase() == name){
            return champions.data[c];
        }
    }
    console.log('[ RESULT ] No champion has been found');
    return null;
};

// Returns the name of a random champion
exports.getRandomChamp = function() {
    var total = Object.keys(champions.data).length;
    var rand = Math.floor(Math.random() * total) + 1;
    var curr = 0;
    // Goes through champion list until it reaches the random number
    for (var c in champions.data){
        curr++;
        if (curr === rand){
            console.log('[ RESPONDING ] Sending random champ result to client');
            return (c);
        }
    }
    return 'NO CHAMP';
}

// Used as a middleware function to ensure rate limit policies for Riot API are followed
exports.rateLimiting = function(req, res, next) {
    // Checks if there is a previous header (always true after the first API call)
    if (Object.keys(lastHeader).length > 0){
        var cleared = true;
        // Break down the API limits and the current call count into arrays (eg. [20:1, 100:120] max allowed and [1:1, 1:120] current calls)
        var appRateLimits = lastHeader['x-app-rate-limit'].split(',');
        var appRateLimitCounts = lastHeader['x-app-rate-limit-count'].split(',');
        var methodRateLimits = lastHeader['x-method-rate-limit'].split(',');
        var methodRateLimitCounts = lastHeader['x-method-rate-limit-count'].split(',');

        // Further parse each element inside the limit arrays (eg. [[20, 1], [100, 120]] max allowed and [[1, 1], [1, 120]] current calls)
        // and then ensure that the current calls does not exceed limit
        for (var i = 0 ; i < appRateLimits.length ; i++){
            appRateLimits[i] = appRateLimits[i].split(':');
            appRateLimitCounts[i] = appRateLimitCounts[i].split(':');
            // If limit is exceeded, the request is not cleared
            if (parseInt(appRateLimitCounts[i][0]) >= parseInt(appRateLimits[i][0]))
                cleared = false;
        }
        // Same as above for loop, but for the method calls instead of app calls
        for (var i = 0 ; i < methodRateLimits.length ; i++){
            methodRateLimits[i] = methodRateLimits[i].split(':');
            methodRateLimitCounts[i] = methodRateLimitCounts[i].split(':');
            // If limit is exceeded, the request is not cleared
            if (parseInt(methodRateLimitCounts[i][0]) >= parseInt(methodRateLimits[i][0]))
                cleared = false;
        }

        // Add a property to the request header containing a value representing whether a request can be made or not
        req.canRequest = cleared;
        next();
    } else { // Allow the very first API call
        req.canRequest = true;
        next();
    }
}

// Takes a full URL and returns a parsed JSON formatted response if successful
function sendRequest(url) {
    return new Promise((resolve, reject) => {
        // Makes a request to the Riot API using the 'url'
        request(url, function(err, res, body) { 
            if (url.match(/^https:\/\/na1.api.riotgames.com*/)){
                lastHeader = res.headers;
            }

            // Checks response headers for all possible statusCodes
            if(!err && res.statusCode == 200) {
                var retData = JSON.parse(body);
                resolve(retData);
            } else if (res.statusCode == 400){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Bad Request (Properly formatted parameter missing)');
                reject();
            } else if (res.statusCode == 401){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Unauthorized (No API Key included in the request)');
                reject();
            } else if (res.statusCode == 403){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Forbidden (Invalid/Expired/Blacklisted API key used)');
                reject();
            } else if (res.statusCode == 404){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Not Found (No Resources for the submitted parameters found)');
                reject();
            } else if (res.statusCode == 405){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': ');
                reject();
            } else if (res.statusCode == 415){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Unsupported Media Type (Content-Type header not appropriately set)');
                reject();
            } else if (res.statusCode == 422){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Player exists, but hasn\'t played since match history collection started');
                reject();
            } else if (res.statusCode == 429){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Rate Limit Exceeded');
                reject();
            } else if (res.statusCode == 500){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Internal Server Error');
                reject();
            } else if (res.statusCode == 502){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Bad Gateway');
                reject();
            } else if (res.statusCode == 503){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Service Unavailable');
                reject();
            } else if (res.statusCode == 504){
                console.log('[ ERROR ] Status Code ' + res.statusCode + ': Gateway Timeout');
                reject();
            }

        });
    });
};

// Takes a filepath and a name of the JSON file
// Reads in the JSON file as a string, parses it into a JSON obj and returns it
function readFileJSON(filePath, name) {
    try {
        var fileData = JSON.parse(fs.readFileSync(filePath));
        console.log('[ LOADED ] ' + name + ' has been loaded');
    } catch (err){
        var fileData = {};
        console.log('[ NOTE ] No ' + name + ' JSON file exists yet');
    }
    return fileData;
}

// Takes a filepath, the data, and a name of the JSON file
// Writes out the JSON object to a file with formatted tabbing
function writeFileJSON(filePath, data, name) {
    fs.writeFile(filePath, JSON.stringify(data, null, "\t"), (err) => { // Write the changes to the JSON file
        if (err) {
            console.log('[ ERROR ] Error writing ' + name + '.json file');
            reject();
        }
        console.log('[ FILE UPDATED ] File ' + name + '.json has been updated');
    });
}

// Takes an integer and checks the summoner list for a match
// Updates existing summoner and returns true if found, otherwise false
function updateSummonerObj(newSumm) {
    var index = 0;
    // Loop through all existing summoners
    for (var summ of leagueData.summoners){
        // If a match is found, update that summoner
        if (summ.id == newSumm.id){
            leagueData.summoners[index].profileIconId = newSumm.profileIconId;
            leagueData.summoners[index].reveisionData = newSumm.reveisionData;
            leagueData.summoners[index].summonerLevel = newSumm.summonerLevel;
            return true;
        }
        index++;
    }
    return false;
}

// Takes an integer and checks the summoner list for a match
// Returns true if found, otherwise false
function checkSummonerExistsID_getName(id) {
    for (var summ of leagueData.summoners){
        if (summ.id == id){
            return summ.name;
        }
    }
    return false;
}

// Takes an integer and checks the summoner list for a match
// Returns true if found, otherwise false
function checkSummonerExistsName_getID(name) {
    var formatName;
    for (var summ of leagueData.summoners){
        formatName = summ.name.toLowerCase().replace(/ /g, '');
        if (formatName == name){
            return summ.id;
        }
    }
    return false;
}

// Takes an integer and checks the champion list for a match
// Returns the champion object if found, 'NO CHAMP' if not found
function getChampNameByID(champID) {
    for(var c in champions.data){
        if (champions.data[c].key == champID){
            return champions.data[c].name;
        }
    }
    return 'NO CHAMP';
}

// Compares the local 'versions.json' with Riots 'versions.json'
// If the contents match then the local static data is up to date, otherwise update it
//
// Returns an object, one property 'updated' storing whether there was an update or not
// and 'version' which holds the latest version
function getLatestVersionData() {
    return new Promise((resolve, reject) => {
        // Get local version
        var localVersionJSON = readFileJSON('./data/versions.json', 'Versions');
        // Request Riot API for the live version
        sendRequest(API_URLs['dd_versions']).then((liveVersionJSON) => {
            // If they are the same, then local data is up to date
            if (liveVersionJSON[0] == localVersionJSON['LoL']){
                console.log('[ UP TO DATE ] Static data is already up to date');
                resolve({'updated': false, 'version': localVersionJSON});
            } else { // Otherwise store the new version
                console.log('[ UPDATING ] Static data is being updated');
                writeFileJSON('./data/versions.json', {'LoL':liveVersionJSON[0]}, 'Versions')
                resolve({'updated': true, 'version': {'LoL': liveVersionJSON[0]}});
            }
        }).catch(() => {
            resolve({'updated': false, 'version': localVersionJSON});
        });
    });
}

// Takes a boolean parameter to determine if the static data is up to date or not
// Returns the most up to date static champion data (updated or local)
function getLatestChampionData(ifUpdated) {
    return new Promise((resolve, reject) => {
        var localChampJSON = {};

        // If the game has not updated, load the locally stored data
        if (ifUpdated === false){
            localChampJSON = readFileJSON('./data/champions.json', 'Champions');
            if (Object.keys(localChampJSON).length != 0)
                resolve(localChampJSON);
        }

        // If the game has updated, or the local file was empty
        if (ifUpdated === true || Object.keys(localChampJSON).length == 0){
            var url = API_URLs['dd_champs'];
            console.log(url);
            url = url.replace('{version}', versions['LoL']);
            // Request champion data from Riot API
            sendRequest(url).then((liveChampData) => {
                // Save it locally
                writeFileJSON('./data/champions.json', liveChampData, 'Champions')
                resolve(liveChampData);
            }).catch((err) => {
                resolve(localChampJSON);
            });
        }
    });
}