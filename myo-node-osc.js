var myo = require('myo');
var osc = require('osc');

var USAGE_STRING = "useage: node myo-node-osc.js [-h] [-test] [-n num_myos] [-in in_port] [-out out_port]\n\
										\t-h: get usage info\n\
										\t-test: enable testing mode\n\
										\t-n num_myos: set the number of Myos to connect to\n\
										\t-in in_port: set the port to receive OSC commands from\n\
										\t-out out_port: set the port to send OSC commands over";

var testing = false;
var numMyos = 1;
var outPort = 9090;
var inPort = 9091;

for (var i = 2; i < process.argv.length; i ++)
{
	switch (process.argv[i])
	{
		case "-test":
		{
			testing = true;
			console.log("Test mode enabled");
			break;
		}
		case "-n":
		{
			if (process.argv.length == i + 1 ||  isNaN(process.argv[i + 1]))
			{
				console.log(USAGE_STRING);
				return;
			}
			else
			{
				numMyos = Number(process.argv[++i]);
				console.log("Number of Myos set to: ", numMyos);
				break;
			}
		}
		case "-in":
		{
			if (process.argv.length == i + 1 ||  isNaN(process.argv[i + 1]))
			{
				console.log(USAGE_STRING);
				return;
			}
			else
			{
				inPort = Number(process.argv[++i]);
				console.log("Receive port set to: ", inPort);
				break;
			}
		}
		case "-out":
		{
			if (process.argv.length == i + 1 ||  isNaN(process.argv[i + 1]))
			{
				console.log(USAGE_STRING);
				return;
			}
			else
			{
				outPort = Number(process.argv[++i]);
				console.log("Send port set to: ", outPort);
				break;
			}
		}
		case "-h":
		{
				console.log(USAGE_STRING);
				return;
		}
		default:
		{
				console.log(USAGE_STRING);
				return;
		}
	}
}

// BEGIN MYO HANDLING
Myo.on('connected', function(){
	this.setLockingPolicy("none");
	console.log(this.macAddress, " Myo has connected!");
});

Myo.on('disconnected', function()	{
	console.log(this.macAddress, " Myo has disconnected!");
});

Myo.on('arm_synced', function()	{
	console.log(this.macAddress, " Myo has synced!");
});

Myo.on('arm_unsynced', function()	{
	console.log(this.macAddress, " Myo has unsynced!");
});

Myo.on('imu', function(data)	{
	var orientation = data.orientation;
	var gyroscope = data.gyroscope;
	var accelerometer = data.accelerometer;
});

Myo.on('pose', function(pose_name, edge)	{
	if (pose_name == "rest")
	{
		return;
	}
	console.log(pose_name, " ", edge ? 1 : 0);
});
// END MYO HANDLING

var Myo1 = myo.create();
var Myo2 = myo.create();
// END INITIALIZATION
