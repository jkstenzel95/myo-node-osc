var Myo = require('myo');
var osc = require('osc');

var USAGE_STRING = "useage: node myo-node-osc.js [-h] [-test] [-in in_port] [-out out_port]\n\
										\t-h: get usage info\n\
										\t-test: enable testing mode\n\
										\t-in in_port: set the port to receive OSC commands from\n\
										\t-out out_port: set the port to send OSC commands over";

var testing = false;
var outPortNum = 7777;
var inPortNum = 7778;
var oscPort;

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
		case "-in":
		{
			if (process.argv.length == i + 1 ||  isNaN(process.argv[i + 1]))
			{
				console.log(USAGE_STRING);
				return;
			}
			else
			{
				inPortNum = Number(process.argv[++i]);
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
				outPortNum = Number(process.argv[++i]);
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

if (inPortNum === outPortNum)
{
	console.log("Error: Sending port is the same as receiving port.");
	return;
}

// BEGIN UDP HANDLING
oscPort = new osc.UDPPort({
	localAddress: "127.0.0.1",
	localPort: inPortNum,
	remoteAddress: "127.0.0.1",
	remotePort: outPortNum
});

oscPort.on('message', function(oscMessage)
{
	var args = oscMessage.args;
	var addressTokens = oscMessage.address.split("/");
	if (addressTokens[1] != "myo" || args == null || args.length < 1)
	{
		return;
	}
	var macProvided = isMacAddress(args[0]) ? 1 : 0;
	var selectedMyo;
	if (macProvided == 1)
	{
		var filterArgs = { "address": args[0] };
		var filterResults = Myo.myos.filter(function(element, index, array)
		{
			return element.macAddress == this.address;
		}, filterArgs);
		if (filterResults.length == 0)
		{
			console.log("Error: Myo with MAC address ", args[1], " not found.");
			return;
		}
		else
		{
				selectedMyo = filterResults[0];
		}
	}
	if (addressTokens[2] == "request")
	{
		switch (args[macProvided])
		{
			case "arm":
				if (macProvided == 1)
				{
					oscPort.send({
						address: "/myo/arm",
						args: [selectedMyo.macAddress, selectedMyo.arm]
					});
				}
				else
				{
					Myo.myos.forEach(function(currentValue, index, array)
					{
						oscPort.send({
							address: "/myo/arm",
							args: [currentValue.macAddress, currentValue.arm]
						});
					});
				}
				break;
			default:
				console.log("Error: Invalid request");
				return;
		}
	}
	else if (addressTokens[2] == "command")
	{
		switch (args[macProvided])
		{
			case "vibrate":
				if (args.length < 2 + macProvided)
				{
					if (macProvided == 1)
					{
						selectedMyo.vibrate("medium");
					}
					else
					{
						Myo.myos.forEach(function(currentValue, index, array)
						{
							currentValue.vibrate();
						});
					}
				}
				else
				{
					switch (args[1 + macProvided])
					{
						case "short":
							break;
						case "medium":
							break;
						case "long":
							break;
						default:
							return;
					}
					if (macProvided == 1)
					{
						selectedMyo.vibrate(args[2]);
					}
					else
					{
						Myo.myos.forEach(function(currentValue, index, array)
						{
							currentValue.vibrate(args[1]);
						});
					}
				}
				break;
			case "zeroOrientation":
			if (macProvided == 1)
			{
				selectedMyo.zeroOrientation();
			}
			else
			{
				Myo.myos.forEach(function(currentValue, index, array)
				{
					currentValue.zeroOrientation();
				});
			}
				break;
			default:
				console.log("Error: Invalid command");
				return;
		}
	}
});

oscPort.on('error', function(err){
	console.log("ERROR IN OSC PORTS", "\n", err);
});
// END UDP HANDLING

// BEGIN MYO HANDLING
Myo.on('connected', function(){
	Myo.setLockingPolicy("none");
	Myo.unlock;
	oscPort.send({
		address: "/myo/connect",
		args: ["1"]
	});
});

Myo.on('disconnected', function()	{
	console.log(this.macAddress, " Myo has disconnected!");
	oscPort.send({
		address: "/myo/connect",
		args: ["0"]
	});
});

Myo.on('arm_synced', function()	{
	console.log(this.macAddress, " Myo has synced!");
	oscPort.send({
		address: "/myo/sync",
		args: [this.macAddress, "1"]
	});
});

Myo.on('arm_unsynced', function()	{
	console.log(this.macAddress, " Myo has unsynced!");
	oscPort.send({
		address: "/myo/sync",
		args: [this.macAddress, "0"]
	});
});

Myo.on('imu', function(data)	{
	var orientation = data.orientation;
	var gyroscope = data.gyroscope;
	var accelerometer = data.accelerometer;
	var atan2 = Math.atan2;
	var asin = Math.asin;
	var roll = atan2(2.0 * (orientation.w * orientation.x + orientation.y * orientation.z),
							1.0 - 2.0 * (orientation.x * orientation.x + orientation.y * orientation.y));
	var pitch = asin(2.0 * (orientation.w * orientation.y - orientation.z * orientation.x));
	var yaw = atan2(2.0 * (orientation.w * orientation.z + orientation.x * orientation.y),
							1.0 - 2.0 * (orientation.y * orientation.y + orientation.z * orientation.z));
	oscPort.send({
		address: "/myo/orientation",
		args: [this.macAddress, orientation.x, orientation.y, orientation.z, orientation.w, roll, pitch, yaw]
	}
	);
	oscPort.send({
		address: "/myo/gyro",
		args: [this.macAddress, gyroscope.x, gyroscope.y, gyroscope.z]
	}
	);
	oscPort.send({
		address: "/myo/accel",
		args: [this.macAddress, accelerometer.x, accelerometer.y, accelerometer.z]
	});
});

Myo.on('pose', function(pose_name)	{
	if (pose_name == "unknown")
	{
		return;
	}
	oscPort.send({
		address: "/myo/pose",
		args: [this.macAddress, pose_name]
	});
});

Myo.on('pose_off', function(pose_name)	{
	oscPort.send({
		address: "/myo/pose",
		args: [this.macAddress, "rest"]
	});
});
// END MYO HANDLING

// BEGIN HELPER METHODS
var isMacAddress = function(token)
{
	return token.search(/^([0-9a-f]{2}[-]){5}([0-9a-f]{2})$/) == 0;
}
// END HELPER METHODS

// BEGIN INITIALIZATION

oscPort.open();
console.log("Sending over port ", outPortNum);
console.log("Receiving over port ", inPortNum);
Myo.onError = function () {
        console.log("Couldn't connect to Myo Connect");
};
Myo.connect("com.stenzel.myo-node-osc");
// END INITIALIZATION
