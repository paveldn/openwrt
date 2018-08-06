'use strict';

const Homey = require('homey');
var SSH = require('node-ssh');

class OpenWrtDevice extends Homey.Device {

	static CreateSshClient(sshSettings, checkdevice) {
		var ssh = new SSH(sshSettings);
		ssh.on('error', function(err) {
			console.log('Oops, something went wrong.');
			console.log(err);
			ssh.end();
			return null;
		});
		
		if (checkdevice)
		{
			ssh.exec('cat /proc/version | grep -w -o OpenWrt', {
				pty: true,
				out: function(out) {
					if (out == 'OpenWrt')
						console.out('OpenWrt device found');
					else
					{
						console.out('Non OpenWrt device');
						ssh.end();
						return null;
					}
				},
				err: function(err) {
					console.out("Can't establish SSH connection");
						ssh.end();
						return null;
				}
			}).start();

		}
		
		return 
	}

	onInit() {
		this.log('device init: ', this.getName(), 'id:', this.getData().id);

	}

	onAdded() {
		this.log('router added as device');
	}

	onDeleted() {
		// stop polling
		this.log('router deleted as device');
	}

	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
		// first stop polling the device, then start init after short delay
		this.log('router device settings changed');
		// do callback to confirm settings change
		return callback(null, true);
	}
	
}

module.exports = OpenWrtDevice;
