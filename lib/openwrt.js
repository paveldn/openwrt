
'use strict';

var SSH = require('node-ssh')


class OpenWrtRouter
{

	static checkConnection(sshconfig)
	{
		var ssh = new SSH();
		console.log('Before connect');
		return ssh.connect(sshconfig).then( function(success) {
			return ssh.execCommand('cat /proc/version | grep -w -o OpenWrt').then(function(result) {
				return result.stdout == 'OpenWrt';
			});
		})
	}

	constructor(sshconfig) {
		console.log('Constructor of OpenWrtRouter called');
		this.config = sshconfig;
		this.isConnected = false;
		this.ssh = new SSH();
		this.connectionPromise = null;
	}

	executeCommand(command)
	{
		var device = this;
		if (!this.isConnected)
		{
			if (this.connectionPromise == null)
			{
				console.log('Connecting to ' + this.config.host);
				this.connectionPromise = this.ssh.connect(this.config);
				this.connectionPromise.then(res => device.isConnected = true);//.catch(err => console.log("Error connecting to device"));
			}
			else
				console.log('Connecting already started');
			return this.connectionPromise.then( function(success) {
				return device.ssh.execCommand(command);
			});
		}
		else
		{
			console.log('Already connected');
			return this.ssh.execCommand(command);
		}
	}

	getConnectedDevices(includeStale)
	{
		// ip neigh | grep -i -e STALE -e REACHABLE
		var cmdStr = "ip -4 neigh | grep -i -e REACHABLE";
		if (includeStale)
			cmdStr += " -e STALE";
		return this.executeCommand(cmdStr).then(function(result) {
			if (result.stderr != '')
				throw new Error(result.stderr);
			var list = result.stdout.split(/\r\n|\r|\n/);
			var nodesList = [];
			for (var indx = 0; indx < list.length; indx++)
			{
				var tmpItem = list[indx].split(' ');
				if (tmpItem.length == 6)
				{
					nodesList.push(
						{
							ip: tmpItem[0],
							mac: tmpItem[4],
							iface: tmpItem[2],
							type: tmpItem[5]
						});
					
				}
			}
			return nodesList;	
		});
	}
	
	readLeases()
	{
		return this.executeCommand('cat /tmp/dhcp.leases').then(function(result) {
			if (result.stderr != '')
				throw new Error(result.stderr);
			var list = result.stdout.split(/\r\n|\r|\n/);
			var leases = [];
			for (var indx = 0; indx < list.length; indx++)
			{
				var tmpItem = list[indx].split(' ');
				if (tmpItem.length < 3) // mandatory field not presented
					continue; 
				var leaseRecord = {
					exparation: new Date(parseInt(tmpItem[0]) * 1000),
					mac: tmpItem[1],
					ip: tmpItem[2]
				};
				if (tmpItem.length > 3)
					leaseRecord.name = (tmpItem[3] == '*') ? null : tmpItem[3];
				if (tmpItem.length > 4)
					leaseRecord.id = (tmpItem[4] == '*') ? null : tmpItem[4];
				leases.push(leaseRecord);
			}
			return leases;	
		});
	}

}

module.exports = OpenWrtRouter;