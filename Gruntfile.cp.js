"use strict";
module.exports = function(grunt) {
	var path = require("path");

	var centerpoint_path = path.resolve(grunt.option("base-path") || "/var/www/centerpoint").replace(/\/+$/, ""); // grunt --base-path "/your/root/path"

	var app_assets_files = {};
	app_assets_files[centerpoint_path + "/website/etc/appConfig.dev.xml"] = centerpoint_path + "/website/etc/appConfig.xml";
	app_assets_files[centerpoint_path + "/website/etc/dbConfig.dev.xml"] = centerpoint_path + "/website/etc/dbConfig.xml";

	var wsdl_files = {};
	var wsdl_file_names = [
					"AnonymousUser",
					"Brand",
					"ConfigurationData",
					"Customer",
					"Domain",
					"Email",
					"Employee",
					"EmployeeSalesTerritory",
					"ItemMaster",
					"Listing",
					"Mls",
					"Offer",
					"OfferItem",
					"OrderAction",
					"OrderTerm",
					"OrderType",
					"OrderTypeBrand",
					"Partner",
					"PartnerKw",
					"PickList",
					"Profile",
					"ProfileLender",
					"Prospect",
					"SalesDocument",
					"SalesTerritory",
					"SubscriptionConfig",
					"SystemUser",
					"Template",
					"ThirdPartyPayer",
					"Vendor"
	];
	for (var i = 0, n=wsdl_file_names.length; i<n; i++) {
		var wsdl_file = centerpoint_path + "/website/etc/WSDL/housevalues.com.contracts.2008-06." + wsdl_file_names[i] + ".wsdl";
		wsdl_files[wsdl_file] =  wsdl_file;
	};

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
							replace(/\<enableGoogleAnalytics\>[01]/, "<enableGoogleAnalytics>0").
							replace(/\<enableGoogleAdWords\>1/, "<enableGoogleAdWords>0").
							replace(/\<enableTracking\>1/, "<enableTracking>0").
							replace(/\<profileInDebug\>[01]/, "<profileInDebug>0").
							replace(/\<wsdlDomain\>[^<]*\<\/wsdlDomain\>/g, "<wsdlDomain>oneservedev."+ env00 +"</wsdlDomain>").
							replace(/\<enableMarketLeaderTracking\>1/, "<enableMarketLeaderTracking>0").
							replace(/\<enableTracking\>1/, "<enableTracking>0").
							replace(/enabled="true"/g, 'enabled="false"').
							replace(/http:\/\/oneservedev[^\/]*\//g, "http://oneservecp/").
							replace(/env[0-9][0-9]/g,  env00)
						;

						return src;
					}
				},
				files: app_assets_files
			},
			http_conf: {
				options: {
					process: function(src/*, filepath*/) {
						// update with env
						src = src.
							replace(/http:\/\/oneservecp\.env[0-9][0-9]\//, "http://oneservecp."+ env00 +"/").
							replace(/http:\/\/oneservedev\.env[0-9][0-9]\//, "http://oneservedev."+ env00 +"/").
							replace(/http:\/\/oneserverender\.env[0-9][0-9]\//, "http://oneserverender."+ env00 +"/").
							replace(/http:\/\/images\.marketleader\.env[0-9][0-9]\//, "http://images.marketleader."+ env00 +"/")
						;

						return src;
					}
				},
				files: {
					"/etc/httpd/conf.d/000-httpd-oneserve-vhost.conf": "/etc/httpd/conf.d/000-httpd-oneserve-vhost.conf"
				}
			},
			wsdl: {
				options: {
					process: function(src/*, filepath*/) {
						// update with env
						src = src.
							replace(/http:\/\/oneservedev[^\/]*\//g, "http://oneservecp/")
						;

						return src;
					}
				},
				files: wsdl_files
			}
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

