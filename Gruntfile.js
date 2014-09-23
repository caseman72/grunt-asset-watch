"use strict";
module.exports = function(grunt) {
	var fs = require("fs")
	var path = require("path");
	var xml_parser = require("xml2js");
	var CleanCSS = require("clean-css");

	var vision_path = path.resolve(grunt.option("base-path") || "/var/www/vision").replace(/\/+$/, ""); // grunt --base-path "/your/root/path"
	var assets_xml = vision_path + "/website/etc/siteDefinition/assets.xml";

	var js_assets_dest = vision_path + "/website/public/js/assets/";
	var js_watch_files = [vision_path + "/website/public/js/**/*.js", "!" + js_assets_dest, assets_xml];
	var js_sections =  ["ngbundle.head.js", "ngbundle.head.min.js", "marketingcenter.inline.js", "choosecontacts.inline.js",
		"mobilecrm.head.js", "mobilecrm.head.min.js", "mobilecrm.inline.js" ]; // grunt --js-sections "a,b,c"

	var css_assets_dest = vision_path + "/website/public/themes/default/css/assets/";
	var css_watch_files = [vision_path + "/website/public/themes/default/**/*.css", "!" + css_assets_dest, assets_xml];
	var css_sections =  ["marketingcenter.css"]; // grunt --css-sections "x,y,z"

	var app_assets_files = {};
	app_assets_files[vision_path + "/website/etc/appConfig.dev.xml"] = vision_path + "/website/etc/appConfig.xml";
	app_assets_files[vision_path + "/website/etc/dbConfig.dev.xml"] = vision_path + "/website/etc/dbConfig.xml";
//	app_assets_files[vision_path + "/website/etc/siteDefinition/vision-crm.xml"] = vision_path + "/website/etc/siteDefinition/vision-crm.xml";

	var env00 = "env" + ("00" + (grunt.option("env") || "02")).replace(/[^0-9]+/, "").slice(-2); // grunt --env "02"
	var use_assets = grunt.option("php") ? "0" : "1"; // grunt --php 1

	console.log("using env = "+ env00 +"\n");

	var css_clean_options = {
		keepSpecialComments: 0,
		keepBreaks: true,
		noRebase: true,
		processImport: false,
		noAdvanced: true
	};

	// load the plugins
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// watch config
	grunt.initConfig({
		concat: {
			app_assets: {
				options: {
					process: function(src, filepath) {

						if (filepath.match(/vision-crm/)) {
							// todo update vision-crm to use css assets
						}
						else {
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
						}

						return src;
					},
				},
				files: app_assets_files
			},
			js_assets: {
				options: {
					//banner: '"use strict";' + "\n",  .replace(/(^|\n)[ \t]*(?:'use strict'|"use strict");?\s*/g, "$1")
					process: function(src, filepath) {
						return "/* " + filepath.replace(/^.*?\/js\//, "/js/") + " */\n" + src.trim() + "\n\n";
					},
				},
				files: {
				},
			},
			css_assets: {
				options: {
					process: function(src, filepath) {
						var min = "";
						try {
							min = new CleanCSS(css_clean_options).minify(src);
						}
						catch (e) {
							console.error(e);
							min = src;
						}

						return "/* " + filepath.replace(/^.*?\/themes\//, "/themes/") + " */\n" + min + "\n";
					},
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
			},
			css_assets: {
				files: css_watch_files,
				tasks: ["concat:css_assets:files"],
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
		var css_assets = {};

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

						// css_assets
						for (var i=0, n=css_sections.length; i<n; i++) {
							var css_asset = css_assets[css_assets_dest+css_sections[i]] = [];
							for(var j=0, m=pages.length; j<m; j++) {
								if (pages[j].$.name == css_sections[i]) {
									var links = pages[j].modules[0].module[0].parameters[0].link;
									for (var k=0, l=links.length; k<l; k++) {
										css_asset.push(vision_path + "/website/public/themes/default/css/" + links[k].$.file);
									}
								}
							}
						}
						// update config
						grunt.config("concat.css_assets.files", css_assets);

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

