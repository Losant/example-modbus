var Modbus = require('jsmodbus');
var Device = require('losant-mqtt').Device;

// IP Address of PLC
var host = 'PLC_IP_ADDRESS';
// Modbus TCP Port (Normally 502)
var port = 502;

// Construct a Losant device.
// LOSANT_DEVICE_ID, LOSANT_ACCESS_KEY, & LOSANT_ACCESS_SECRET are obtained from Losant
var device = new Device({
  id: 'LOSANT_DEVICE_ID',
  key: 'LOSANT_ACCESS_KEY',
  secret: 'LOSANT_ACCESS_SECRET'
});

var client = Modbus.client.tcp.complete({
  'host': host,
  'port': port,
  'autoReconnect': true,
  'reconnectTimeout': 1000,
  'timeout': 5000,
  'unitId': 0
});

// Connect to PLC.
client.connect();

// Connect to Losant.
device.connect(function (error) {
  if (error) {
    // Handle error
    throw error;
  }
  // Successfully connected
  console.log('Connected to Losant');
});

// Handle PLC Connection
client.on('connect', function () {
  console.log('Connected to PLC');

  // Read Discrete Inputs 0-15 every second 
  setInterval(() => {
    client.readDiscreteInputs(0, 15).then(function (resp) {
      var state = resp.coils.reduce((object, coil, index) => {
        object[`input-${index}`] = coil;
        return object
      }, {})
      // Report all Discrete Inputs to Losant.
      device.sendState(state);
    }, console.error);
  }, 1000);

  // Listen for Losant commands.
  device.on('command', function (command) {
    // The command 'output' will write to a single coil.
    if (command.name = 'output') {
      // command.payload.coil and command.payload.value are apart of the device command from Losant.
      client.writeSingleCoil(command.payload.coil, command.payload.value).then(function (resp) {
        console.log(`Wrote the vale "${command.payload.value}" to coil "${command.payload.coil}" `);
      }, console.error);
    }
  });
});

// Log errors
client.on('error', function (err) {
  console.log(err);
})