/**
 * Created with JetBrains WebStorm.
 * User: otaranenko
 * Date: 29.06.12
 * Time: 09:00
 * To change this template use File | Settings | File Templates.
 */

var initialConfig = {};

(function() {


	try {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'config/config.json', false);
		xhr.send(null);
		initialConfig = eval("(" + xhr.responseText + ")");
	} catch (e) {
		console.warn('No App configuration defined. Consult readme.txt for more information.')
	}


	/************************************
	 *         LOGGING BOOTSTRAP        *
	 ************************************/

	var configuration = loggingConfig;

	var logEnabled = configuration.enabled;

	if (logEnabled) {
		var appender = eval('new log4javascript.' + configuration.appender + '()'),
			evalLevel = function(level) {
				return eval('log4javascript.Level.' + level);
			},
			threshold = evalLevel(configuration.appenderThreshold),
			layout = eval('new log4javascript.PatternLayout("' + configuration.layout + '")'),
			rootLogger = log4javascript.getRootLogger(),
			rootLevel = evalLevel(configuration.rootLevel),
			LEVEL = configuration.LEVEL;

		appender.setThreshold(threshold);
		appender.setLayout(layout);
		rootLogger.setLevel(rootLevel);
		rootLogger.addAppender(appender);
	}


	/************************************
	 *     CHECK DEVELOPMENT MODE       *
	 ************************************/

	var doCheckLocalhost = !!initialConfig.check_localhost,
		config = {};

	// current logger
	var log = log4javascript.getLogger('config.js');
	if (doCheckLocalhost) {
		var hostname = location.hostname,
			isLocalhost = /localhost/.test(hostname),
			urlParams = parseUrlParameters();

		if (isLocalhost) {
			config = copyTo(initialConfig, urlParams, 'staging,debug,version,loglevel,cleanup');
		}
		if (config.debug) {
			log.trace(location.search);
			log.trace('App configuration: ', initialConfig, ', Url parameters: ', urlParams);
		}
	}
	if (config.debug) {
		log.debug('Effective config: ', config);
	}

	if (config.loglevel) {
		console.warn('Log level is overridden via url setting. Config log level: %s, new one: %s', configuration.rootLevel, config.loglevel);
		rootLogger.setLevel(evalLevel(config.loglevel));
	}

	/************************************
	 *      LOGGING CONFIGURATION       *
	 ************************************/

	if (logEnabled) {
		for (var levelName in LEVEL) {
			if (!LEVEL.hasOwnProperty(levelName)) {
				continue;
			}
			var loggerNames = LEVEL[levelName],
				level = evalLevel(levelName);

			for (var i = 0; i < loggerNames.length; i++) {
				var loggerName = loggerNames[i],
					logger = log4javascript.getLogger(loggerName);

				logger.setLevel(level);
			}
		}
	}

	if (config.cleanup) {
		log.warn('Request for Local Setting cleanup. All data saved from prev session will be wiped. Check manual for more information.')
		window.localStorage.clear();
	}


	function parseUrlParameters() {
		var ret = {},
			search = location.search,
			parameters = search.split(/[\?&]/);

		for (var i=0; i < parameters.length; i++) {
			var parameter = decodeURI(parameters[i]);

			if (parameter.indexOf('=') == -1) {
				if (parameter && parameter.length) {
					ret[parameter.trim()] = true;
				}
			} else {
				var keyValue = parameter.split('='),
					key = keyValue[0].trim();

				if (key && key.length) {
					ret[key] = keyValue[1].trim();
				}
			}
		}

		return ret;
	}

	/// lightweight analog of Ext.copyTo
	function copyTo(dest, source, names) {
		if (typeof names == 'string') {
			names = names.split(/[,;\s]/);
		}
		for (var i = 0; i < names.length; i++) {
			var name = names[i];
			if (source.hasOwnProperty(name)) {
				dest[name] = source[name];
			}
		}
		return dest;
	}


})();
