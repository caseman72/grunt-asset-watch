"use strict";
module.exports = function(grunt) {
	var path = require("path");

	var centerpoint_path = path.resolve(grunt.option("base-path") || "/var/www/centerpoint").replace(/\/+$/, ""); // grunt --base-path "/your/root/path"

	var app_assets_files = {};
	app_assets_files[centerpoint_path + "/website/etc/appConfig.dev.xml"] = centerpoint_path + "/website/etc/appConfig.xml";
	app_assets_files[centerpoint_path + "/website/etc/dbConfig.dev.xml"] = centerpoint_path + "/website/etc/dbConfig.xml";

	var env00 = "env" + ("00" + (grunt.option("env") || "02")).replace(/[^0-9]+/, "").slice(-2); // grunt --env "02"
	var use_assets = grunt.option("php") ? "0" : "1"; // grunt --php 1

	// load the plugins
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// watch config
	grunt.initConfig({
		concat: {
			app_assets: {
				options: {
					process: function(src/*, filepath*/) {

						// fix these things
						src = src.
							replace(/\<versionTimeStamp\>0/, "<versionTimeStamp>1").
							replace(/\<useAssets\>[01]/, "<useAssets>"+use_assets).
							replace(/\<enableGoogleAnalytics\>1/, "<enableGoogleAnalytics>0").
							replace(/\<enableGoogleAdWords\>1/, "<enableGoogleAdWords>0").
							replace(/\<enableTracking\>1/, "<enableTracking>0").
							replace(/\<profileInDebug\>[01]/, "<profileInDebug>0").
							replace(/\<enableMarketLeaderTracking\>1/, "<enableMarketLeaderTracking>0").
							replace(/\<enableTracking\>1/, "<enableTracking>0").
							replace(/enabled="true"/g, 'enabled="false"').
							replace(/env[0-9][0-9]/g,  env00);

						return src;
					},
				},
				files: app_assets_files
			},
		}
	});

	// Default task(s).
	grunt.registerTask("default", ["concat"]);

	process.on('SIGINT', function() {
		// return vision-crm to normal and then exit

		console.log("\n");
		process.exit(0);
		console.log("\n");
	});
};

