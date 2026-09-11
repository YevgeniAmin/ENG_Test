const { driveVersionsProxy } = require("./src/http/driveVersionsProxy");
const { atpSimulationProxy } = require("./src/http/simulationProxy");
const { journalInsightProxy } = require("./src/http/journalInsightProxy");

exports.driveVersionsProxy = driveVersionsProxy;
exports.atpSimulationProxy = atpSimulationProxy;
exports.journalInsightProxy = journalInsightProxy;
