/**
 * Created with JetBrains WebStorm.
 * User: otaranenko
 * Date: 22.07.12
 * Time: 19:03
 * To change this template use File | Settings | File Templates.
 */
var log4javascript_disabled = true;
var loggingConfig;
(function() {

	try {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'config/loggingCfg.json', false);
		xhr.send(null);
		loggingConfig = eval("(" + xhr.responseText + ")");
	} catch (e) {
		loggingConfig = {}
	}

	var enabled = loggingConfig.enabled === true;

	if (!enabled) {
		// load log4javascript stub
		console.log('Logging subsystem is off. Only direct console.log()/warn()... would be shown. Please consult manual for more information.');
		return;
	}


	log4javascript_disabled = false;

})();
