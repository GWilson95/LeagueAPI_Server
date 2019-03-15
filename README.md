# League of Legends API Proxy Server
#### By Graham Wilson
#### Last Updated: March 15, 2019
#### Version 1.1.0 

## Description
This file is the main proxy server for the League of
Legends API. It takes requests through specific url
routes with parameters. It takes these requests, formats
them to follow the Riot API specifications and adds the
Riot API Key assigned to this application before
forwarding it to the API. It also ensures that rate the
rate limits are never exceeded.

## How To Use
You can access the statistics directly by entering the
URL of the website this program is running on, followed
by '/api/{route}'. Or you can use the JS request package
to get the data from this server. Either way, the proxy
server will return a JSON formatted object containing
the requested information.

## Available Routes
The following routes are accessible through whatever path
you are hosting the server followed by the route.
#### HOST-URL/api/updateSum/:sumName
    Replace ':sumName' with a summoners name to force the server to update that summoners basic stats.
#### HOST-URL/api/getSumId/:sumName
    Replace ':sumName' with a summoners name to get that summoners encrypted account ID.
#### HOST-URL/api/getSumName/:sumId
    Replace ':sumId' with an encrypted account ID to get the accounts summoner name.
#### HOST-URL/api/getMasteriesById/:id
    Replace ':id' with an encrypted account ID to get that summoners champion masteries.
#### HOST-URL/api/champInfo/:champName
    Replace ':champName' with the name of a Champions name to get their statistics.
#### HOST-URL/api/champRandom
    This route returns a random Champion.