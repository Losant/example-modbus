var modbus = require('jsmodbus');
var Device = require('losant-mqtt').Device;

var host = 'PLC_IP_ADDRESS';
var port = 502;

// Construct device.
var device = new Device({
  id: 'LOSANT_DEVICE_ID',
  key: 'LOSANT_ACCESS_KEY',
  secret: 'LOSANT_ACCESS_SECRET'
});

var client = modbus.client.tcp.complete({
  'host': host,
  'port': port,
  'autoReconnect': true,
  'reconnectTimeout': 1000,
  'timeout': 5000,
  'unitId': 0
});

client.connect();
// Connect to Losant.
device.connect(function (error) {
  if (error) {
    // Handle error
    throw error;
  }
  // Successfully connected
  console.log('Connected to Losant')
});

client.on('connect', function () {
  console.log('Connected to PLC')
  setInterval(() => {
    client.readCoils(0, 15).then(function (resp) {
      var state = resp.coils.reduce((object, coil, index) => {
        object[`output-${index}`] = coil;
        return object
      }, {})
      device.sendState(state);;
    }, console.error);
  }, 1000);

  setInterval(() => {
    client.readDiscreteInputs(0, 15).then(function (resp) {
      var state = resp.coils.reduce((object, coil, index) => {
        object[`input-${index}`] = coil;
        return object
      }, {})
      device.sendState(state);;
    }, console.error);
  }, 1000);

  // Listen for commands.
  device.on('command', function (command) {
    console.log('Command received.');
    console.log(command.name);
    console.log(command.payload);

    if (command.name = 'output') {
      client.writeSingleCoil(command.payload.coil, command.payload.value).then(function (resp) {
        // resp will look like { fc: 5, byteCount: 4, outputAddress: 5, outputValue: true }
        console.log(resp);
      }, console.error);
    }
  });



});

client.on('error', function (err) {

  console.log(err);

})