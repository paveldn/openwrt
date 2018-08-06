'use strict';

const Homey = require('homey');
var OpenWrt = require('../../lib/openwrt')

class OpenWrtDriver extends Homey.Driver {

	onInit() {
		this.log('OpenWrt onInit');
	}

	onPair(socket) {
		socket.on('save', async (data, callback) => {
			try {
				console.log('save button pressed in frontend');
				var sshconfig = {
 					host: data.host,
					username: data.username,
					port: data.port,
					password: data.password
				};
				console.log('SSH settings: ' + JSON.stringify(sshconfig));
				var router = new OpenWrt(sshconfig);
				var result = await router.executeCommand('cat /proc/version | grep -w -o OpenWrt').then(function(result) {
					return result.stdout == 'OpenWrt' ? 'OpenWrt' : 'Wrong router type';
				}).catch(function(err) {
					return 'Wrong connection';
				});
				console.log(result);
				if (result != 'OpenWrt')
				{
					callback(result, false);
					return;
				}
				console.log('Detecting router model');
				var routermodel = await router.executeCommand('cat /tmp/sysinfo/model').then(function(result) {
					console.log(result);
					return result.stdout;
				}).catch(function(err) {
					return 'Unknown';
				});
				console.log('routermodel=' + routermodel);
				callback(routermodel, true);
			} catch (error) {
				callback('Connection error :' + error, false);
			}

		});
	}

}

module.exports = OpenWrtDriver;

