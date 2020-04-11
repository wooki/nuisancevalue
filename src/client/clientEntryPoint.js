import querystring from 'query-string';
import { Lib } from 'lance-gg';
import NvClientEngine from '../client/NvClientEngine';
import NvGameEngine from '../common/NvGameEngine';
const qsOptions = querystring.parse(location.search);

import '../css/main.scss';

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
    traceLevel: Lib.Trace.TRACE_ALL,
    delayInputCount: 100,
    scheduler: 'render-schedule',
    syncOptions: {
      sync: qsOptions.sync || 'extrapolate',
      localObjBending: 0.6,
      remoteObjBending: 0.6,
      bendingIncrements: 6
    }
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const gameEngine = new NvGameEngine(options);
const clientEngine = new NvClientEngine(gameEngine, options);

document.addEventListener('DOMContentLoaded', function(e) { clientEngine.start(); });
