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
#### /api/updateSum/:sumName
DOES...
#### /api/getSumId/:sumName
#### /api/getSumName/:sumId
#### /api/getSumName/:sumId
#### /api/getMasteriesById/:id
#### /api/champInfo/:champName
#### /api/champRandom