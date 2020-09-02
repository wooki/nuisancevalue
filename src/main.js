import path from 'path';
import express from 'express';
import socketIO from 'socket.io';
import { Lib } from 'lance-gg';
import NvGameEngine from './common/NvGameEngine';
import NvServerEngine from './server/NvServerEngine';

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, '../dist/index.html');

// define routes and socket
const server = express();
server.get('/', function(req, res) { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '../dist/')));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(requestHandler);

// Trace.TRACE_ERROR
// Trace.TRACE_WARN
// Trace.TRACE_INFO
// Trace.TRACE_DEBUG
// Trace.TRACE_ALL

// Game Instances
const gameEngine = new NvGameEngine({ traceLevel: Lib.Trace.TRACE_WARN });
const serverEngine = new NvServerEngine(io, gameEngine, {
	updateRate: 12, // most movement is deterministic so allow for complex/slow server processing by slowing this
	stepRate: 60,
	fullSyncRate: 60, // we're getting everything frequently anyway so slow this
	// updateRate: 6,
	// stepRate: 60,
	// fullSyncRate: 20,
	timeoutInterval: 1200
});

// start the game
serverEngine.start();
