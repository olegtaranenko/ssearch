/**
 * Created with JetBrains WebStorm.
 * User: otaranenko
 * Date: 17.10.12
 * Time: 13:22
 * To change this template use File | Settings | File Templates.
 */
Ext.define('SSearch.common.Config', {
	singleton: true,
	alternateClassName: 'Config',

	application: {},

	constructor: function() {
		this.callParent(arguments);
		var config = this.application;

//		var initialConfig = SSearch.config.initial;

		/************************************
		 *       SET applicationConfig      *
		 ************************************/

		var log = log4javascript.getLogger('config.js');
		Ext.applyIf(config, initialConfig);

		var apiUri = createApiUri(config);
		log.info('Api uri: ', apiUri);

		//	alert(apiUri);
		config.apiUri = apiUri;


		function createApiUri(config) {
			var protocol = config.protocol || 'https',
				api_version = config.api_version || 'v1',
				domain = config.domain || 'successful-search.com',
				subdomain = config.subdomain || 'api',
				stagingValue = config.staging,
				staging = Ext.isBoolean(stagingValue) ? stagingValue : true,
				stage_name = config.stage_name || 'prelive',
				fmt = '{0}://',
				fmtArgs = [protocol],
				fmtIndex = 1,
				appendDot = '';

			if (subdomain) {
				fmt += '{' + fmtIndex++ + '}';
				fmtArgs.push(subdomain);
				appendDot = '.';
			}

			if (staging && stage_name) {
				fmt += '{' + fmtIndex++ + '}';
				fmtArgs.push(stage_name);
				appendDot = '.';
			}

			fmt += appendDot + '{' + fmtIndex++ + '}/{' + fmtIndex + '}';
			fmtArgs.push(domain, api_version);

			fmtArgs.unshift(fmt);
			return Ext.String.format.apply(this, fmtArgs);
		}


		var configuration = loggingConfig;


		var logEnabled = configuration.enabled,
			getLogger = logEnabled ? function (name) {
				return log4javascript.getLogger(name);
			} : function () {
				return log4javascript.getNullLogger();
			};

		Ext.ClassManager.registerPostprocessor('log4javascript', function(clsName, cls, clsConfig) {
			//console.log('log4javascript preprocessor call', clsName, cls.prototype, clsConfig);
			if (cls && cls.prototype) {
				cls.prototype.getLogger = function() {
					return getLogger(clsName);
				}
			} else {
				cls.getLogger = function() {
					return getLogger(clsName);
				};
			}
		}, [
			'$className'
		]);
	},
	requires: [
		'Ext.Loader'
	]
});