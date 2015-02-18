"use strict";
module.exports = function(grunt) {
	var fs = require("fs")
	var path = require("path");
	var xml_parser = require("xml2js");

	var use_assets = grunt.option("php") ? "0" : "1"; // grunt --php 1

	var vision_path = path.resolve(grunt.option("base-path") || "/var/www/vision").replace(/\/+$/, ""); // grunt --base-path "/your/root/path"
	var assets_xml = vision_path + "/website/etc/siteDefinition/assets.xml";

	var js_assets_dest = vision_path + "/website/public/js/assets/";
	var js_watch_files = [vision_path + "/website/public/js/**/*.js", "!" + js_assets_dest, assets_xml];
	var js_sections =  [
		"ngbundle.head.js", "ngbundle.head.min.js",
		"editor.head.js", "editor.head.min.js",
		"marketingcenter.inline.js",
		"choosecontacts.inline.js"
		//"nrtsupport.inline.js,
		//"mobilecrm.head.js",
		//"mobilecrm.head.min.js",
		//"mobilecrm.inline.js"
	];
	// TODO grunt --js-sections "a,b,c"

	var app_assets_files = {};
	app_assets_files[vision_path + "/website/etc/appConfig.dev.xml"] = vision_path + "/website/etc/appConfig.xml";
	app_assets_files[vision_path + "/website/etc/dbConfig.dev.xml"] = vision_path + "/website/etc/dbConfig.xml";

	var env00 = "env" + ("00" + (grunt.option("env") || "02")).replace(/[^0-9]+/, "").slice(-2); // grunt --env "02"
	console.log("using env = "+ env00 +"\n");

	// load the plugins
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-newer");

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
//							replace(/http:\/\/oneservedev[^\/]*\//g, "http://oneservedev."+ env00 +"/").
							replace(/env[0-9][0-9]/g,  env00);

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
							replace(/http:\/\/oneservedev\.env[0-9][0-9]\//, "http://oneservedev."+ env00 +"/")
						return src;
					}
				},
				files: {
					"/etc/httpd/conf.d/000-httpd-oneserve-vhost.conf": "/etc/httpd/conf.d/000-httpd-oneserve-vhost.conf"
				},
			},
			js_assets: {
				options: {
					//banner: '"use strict";' + "\n",  .replace(/(^|\n)[ \t]*(?:'use strict'|"use strict");?\s*/g, "$1")
					process: function(src, filepath) {
						return "/* " + filepath.replace(/^.*?\/js\//, "/js/") + " */\n" + src.trim() + "\n\n";
					}
				},
				files: {
				},
			}
		},
		watch: {
			js_assets: {
				files: js_watch_files,
				tasks: ["concat:js_assets:files"],
				options: {
					spawn: false
				}
			}
		}
	});

	// parse task
	grunt.task.registerTask("parse", "parse", function() {
		var done = this.async();
		var js_assets = {};

		// read in assets_xml
		fs.readFile(assets_xml, {encoding: "utf8"}, function (assets_err, assets_data) {
			if (assets_err) {
				console.error("No assests file");
			}
			else {
				xml_parser.parseString(assets_data, function (json_err, json_data) {
					if (!json_err) {
						var pages = json_data.section.pages[0].page || [];

						// js_assets
						for (var i=0, n=js_sections.length; i<n; i++) {
							var js_asset = js_assets[js_assets_dest+js_sections[i]] = [];
							for(var j=0, m=pages.length; j<m; j++) {
								if (pages[j].$.name == js_sections[i]) {
									var scripts = pages[j].modules[0].module[0].parameters[0].script;
									for (var k=0, l=scripts.length; k<l; k++) {
										js_asset.push(vision_path + "/website/public/js/" + scripts[k].$.file);
									}
								}
							}
						}
						// update config
						grunt.config("concat.js_assets.files", js_assets);

						// next
						done();
					}
				});
			}
		});
	});

	// on watch - parse first if assest file changes
	grunt.event.on("watch", function(not_used_action, filepath) {
		if (path.resolve(filepath) === assets_xml) {
			grunt.task.run("parse");
		}
	});

	// Default task(s).
	grunt.registerTask("default", ["parse", "concat", "watch"]);

	process.on('SIGINT', function() {
		// return vision-crm to normal and then exit

		console.log("\n");
		process.exit(0);
		console.log("\n");
	});
};

