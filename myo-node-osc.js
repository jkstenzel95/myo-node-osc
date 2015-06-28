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
var port = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: IN_PORT,
    remoteAddress: "127.0.0.1",
    remotePort: OUT_PORT
});

// END INITIALIZE PORTS

// BEGIN UDP HANDLING
	port.on('message', function(oscMessage)
	{
		console.log("RECEIVED: ", oscMessage);
		//var oscTokens = oscMessage.split();
	});

	port.on('error', function(err){
		console.log("ERROR\n", err);
	});
// END UDP HANDLING

// BEGIN MYO HANDLING
Myo.on('connected', function(){
	this.setLockingPolicy("none");
	console.log(this.arm, " Myo has connected!");
	port.send({
		address: "/Myo/" + this.arm + "/connected",
		args: "1"
	});
});

Myo.on('disconnected', function()	{
	console.log(this.arm, " Myo has disconnected!");
	port.send({
		address: "/Myo/" + this.arm + "/connected",
		args: "0"
	});
});

Myo.on('arm_synced', function()	{
	console.log(this.arm, " Myo has synced!");
	port.send({
		address: "/Myo/" + this.arm + "/synced",
		args: "1"
	});
});

Myo.on('arm_unsynced', function()	{
	console.log(this.arm, " Myo has unsynced!");
	port.send({
		address: "/Myo/" + this.arm + "/synced",
		args: "0"
	});
});

Myo.on('imu', function(data)	{
	var orientation = data.orientation;
	var gyroscope = data.gyroscope;
	var accelerometer = data.accelerometer;
	port.send({
		address: "/Myo/" + this.arm + "/imu/orientation",
		args: [orientation.x, orientation.y, orientation.z, orientation.W]
	}, "127.0.0.1", OUT_PORT
	);
	port.send({
		address: "/Myo/" + this.arm + "/imu/gyroscope",
		args: [gyroscope.x, gyroscope.y, gyroscope.z]
	}, "127.0.0.1", OUT_PORT
	);
	port.send({
		address: "/Myo/" + this.arm + "/imu/accelerometer",
		args: [accelerometer.x, accelerometer.y, accelerometer.z]
	});
});

Myo.on('pose', function(pose_name, edge)	{
	if (pose_name == "rest")
	{
		return;
	}
	console.log(pose_name, " ", edge ? 1 : 0);
	port.send({
		address: "/Myo/" + this.arm + "/pose/" + pose_name,
		args: edge
	});
});
// END MYO HANDLING

// BEGIN INITIALIZATION
port.open();

var Myo1 = myo.create();
var Myo2 = myo.create();
// END INITIALIZATION