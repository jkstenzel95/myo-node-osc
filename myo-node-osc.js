var myo = require('myo');
var osc = require('osc');

// Change these as needed
var OUT_PORT = 9090;
var IN_PORT = 9091;
var testing = false;

for (var i = 2; i < process.argv.length; i ++)
{
	switch (process.argv[i])
	{
		case "-test":
		{
			testing = true;
			break;
		}
	}
}

// BEGIN NITIALIZE PORTS
var outPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: OUT_PORT
});
var inPort;

if (testing)
{
inPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: IN_PORT
});
}
else
{
	inPort = outPort;
}
// END INITIALIZE PORTS

// BEGIN UDP HANDLING
	// BEGIN UDP RECEIVE HANDLING
	inPort.on('message', function(oscMessage)
	{
		console.log("RECEIVED: ", oscMessage);
		var oscTokens = message.split();
	});

	inPort.on('error', function(err){
		console.log("ERROR RECEIVING DATA")
	});
	// END UDP RECEIVE HANDLING

	// BEGIN UDP SEND HANDLING
	outPort.on('error', function(err){
		console.log("ERROR SENDING DATA")
	});
	// END UDP SEND HANDLING
// END UDP HANDLING

// BEGIN MYO HANDLING
Myo.on('connected', function(){
	console.log(Myo.arm, " Myo has connected!")
	outPort.send({
		address: "/Myo/" + Myo.arm + "/connected",
		args: "1"
	}, "127.0.0.1", OUT_PORT
	);
});

Myo.on('disconnected', function()	{
	console.log(Myo.arm, " Myo has disconnected!")
	outPort.send({
		address: "/Myo/" + Myo.arm + "/connected",
		args: "0"
	}, "127.0.0.1", OUT_PORT
	);
});

Myo.on('arm_synced', function()	{
	console.log(Myo.arm, " Myo has synced!")
	outPort.send({
		address: "/Myo/" + Myo.arm + "/synced",
		args: "1"
	}, "127.0.0.1", OUT_PORT
	);
});

Myo.on('arm_unsynced', function()	{
	console.log(Myo.arm, " Myo has unsynced!")
	outPort.send({
		address: "/Myo/" + Myo.arm + "/synced",
		args: "0"
	}, "127.0.0.1", OUT_PORT
	);
});

Myo.on('imu', function(data)	{
	var orientation = data.orientation;
	var gyroscope = data.gyroscope;
	var accelerometer = data.accelerometer;
	outPort.send({
		address: "/Myo/" + Myo.arm + "/imu/orientation",
		args: [orientation.x, orientation.y, orientation.z, orientation.W]
	}, "127.0.0.1", OUT_PORT
	);
	outPort.send({
		address: "/Myo/" + Myo.arm + "/imu/gyroscope",
		args: [gyroscope.x, gyroscope.y, gyroscope.z]
	}, "127.0.0.1", OUT_PORT
	);
	outPort.send({
		address: "/Myo/" + Myo.arm + "/imu/accelerometer",
		args: [accelerometer.x, accelerometer.y, accelerometer.z]
	}, "127.0.0.1", OUT_PORT
	);
});

Myo.on('pose', function(pose_name, edge)	{
	console.log(pose_name, " ", edge);
	outPort.send({
		address: "/Myo/" + Myo.arm + "/pose/" + pose_name,
		args: edge
	}, "127.0.0.1", OUT_PORT
	);
});
// END MYO HANDLING

// BEGIN INITIALIZATION
inPort.open();
outPort.open();

var Myo1 = myo.create();
var Myo2 = myo.create();
// END INITIALIZATION