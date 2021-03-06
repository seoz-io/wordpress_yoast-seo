const CaseSensitivePathsPlugin = require( "case-sensitive-paths-webpack-plugin" );
const path = require( "path" );
const mapValues = require( "lodash/mapValues" );
const isString = require( "lodash/isString" );

const paths = require( "./paths" );
const BundleAnalyzerPlugin = require( "webpack-bundle-analyzer" ).BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require( "mini-css-extract-plugin" );

const root = path.join( __dirname, "../../" );
const mainEntry = mapValues( paths.entry, entry => {
	if ( ! isString( entry ) ) {
		return entry;
	}

	return "./" + path.join( "js/src/", entry );
} );

const externals = {
	// This is necessary for Gutenberg to work.
	tinymce: "window.tinymce",

	yoastseo: "window.yoast.analysis",
	"yoast-components": "window.yoast.components",
	react: "React",
	"react-dom": "ReactDOM",
	redux: "window.yoast.redux",
	"react-redux": "window.yoast.reactRedux",
	jed: "window.yoast.jed",

	lodash: "window.lodash",
	"lodash-es": "window.lodash",
	"styled-components": "window.yoast.styledComponents",
	"draft-js": "window.yoast.draftJs",
};

const wordpressExternals = {
	"@wordpress/api-fetch": "window.wp.apiFetch",
	"@wordpress/block-editor": "window.wp.blockEditor",
	"@wordpress/blocks": "window.wp.blocks",
	"@wordpress/components": "window.wp.components",
	"@wordpress/compose": "window.wp.compose",
	"@wordpress/data": "window.wp.data",
	"@wordpress/dom": "window.wp.dom",
	"@wordpress/element": "window.wp.element",
	"@wordpress/html-entities": "window.wp.htmlEntities",
	"@wordpress/edit-post": "window.wp.editPost",
	"@wordpress/i18n": "window.wp.i18n",
	"@wordpress/is-shallow-equal": "window.wp.isShallowEqual",
	"@wordpress/keycodes": "window.wp.keycodes",
	"@wordpress/plugins": "window.wp.plugins",
	"@wordpress/rich-text": "window.wp.richText",
	"@wordpress/server-side-render": "window.wp.serverSideRender",
	"@wordpress/url": "window.wp.url",
	"@wordpress/dom-ready": "window.wp.domReady",
	"@wordpress/a11y": "window.wp.a11y",
};

// Make sure all these packages are exposed in `./js/src/components.js`.
const yoastExternals = {
	"@yoast/analysis-report": "window.yoast.analysisReport",
	"@yoast/components": "window.yoast.componentsNew",
	"@yoast/configuration-wizard": "window.yoast.configurationWizard",
	"@yoast/feature-flag": "window.yoast.featureFlag",
	"@yoast/helpers": "window.yoast.helpers",
	"@yoast/replacement-variable-editor": "window.yoast.replacementVariableEditor",
	"@yoast/search-metadata-previews": "window.yoast.searchMetadataPreviews",
	"@yoast/social-metadata-forms": "window.yoast.socialMetadataForms",
	"@yoast/style-guide": "window.yoast.styleGuide",
};

const defaultAllowedHosts = [
	"local.wordpress.test",
	"one.wordpress.test",
	"two.wordpress.test",
	"build.wordpress-develop.test",
	"src.wordpress-develop.test",
	"basic.wordpress.test",
];

let bundleAnalyzerPort = 8888;

/**
 * Creates a new bundle analyzer on a unique port number.
 *
 * @returns {BundleAnalyzerPlugin} bundle analyzer.
 */
function createBundleAnalyzer() {
	return new BundleAnalyzerPlugin( {
		analyzerPort: bundleAnalyzerPort++,
		statsOptions: {
			excludeModules: ( module ) => {
				module = module + "";

				let exclude = false;

				// The webpack dev server requires these, so exclude them:
				[
					"sockjs-client/dist",
					"html-entities/lib",
					"url/url.js",
					"loglevel/lib",
					"punycode/punycode.js",
					"localhost:8080",
					"ansi-html",
					"events/events.js",
					"querystring-es3",
					"client/overlay.js",
				].forEach( ( dep ) => {
					if ( module.includes( dep ) ) {
						exclude = true;
					}
				} );

				return exclude;
			},
		},
	} );
}

/**
 * Adds a bundle analyzer to a list of webpack plugins.
 *
 * @param {Array} plugins Current list of plugins.
 * @returns {Array} List of plugins including the webpack bundle analyzer.
 */
function addBundleAnalyzer( plugins ) {
	if ( process.env.BUNDLE_ANALYZER ) {
		return [ ...plugins, createBundleAnalyzer() ];
	}

	return plugins;
}

module.exports = function( env ) {
	if ( ! env ) {
		env = {};
	}
	if ( ! env.environment ) {
		env.environment = process.env.NODE_ENV || "production";
	}
	if ( ! env.pluginVersion ) {
		// eslint-disable-next-line global-require
		env.pluginVersion = require( root + "package.json" ).yoast.pluginVersion;
	}

	const pluginVersionSlug = paths.flattenVersionForFile( env.pluginVersion );

	// Allowed hosts is space separated string. Example usage: ALLOWED_HOSTS="first.allowed.host second.allowed.host"
	let allowedHosts = ( process.env.ALLOWED_HOSTS || "" ).split( " " );
	// The above will result in an array with an empty string if the environment variable is not set, which is undesired.
	allowedHosts = allowedHosts.filter( el => el );
	// Prepend the default allowed hosts.
	allowedHosts = defaultAllowedHosts.concat( allowedHosts );

	const outputFilename = "[name]-" + pluginVersionSlug + ".js";

	const plugins = [
		new CaseSensitivePathsPlugin(),
		new MiniCssExtractPlugin(
			{
				filename: "css/dist/monorepo-" + pluginVersionSlug + ".css",
			}
		),
	];

	const base = {
		mode: env.environment,
		devtool: env.environment === "development" ? "cheap-module-eval-source-map" : false,
		context: root,
		output: {
			path: paths.jsDist,
			filename: outputFilename,
			jsonpFunction: "yoastWebpackJsonp",
		},
		resolve: {
			extensions: [ ".json", ".js", ".jsx" ],
			symlinks: false,
		},
		module: {
			rules: [
				{
					test: /.jsx?$/,
					exclude: /node_modules[/\\](?!(yoast-components|gutenberg|yoastseo|@wordpress|@yoast|parse5)[/\\]).*/,
					use: [
						{
							loader: "babel-loader",
							options: {
								cacheDirectory: true,
								env: {
									development: {
										plugins: [
											"babel-plugin-styled-components",
										],
									},
								},
							},
						},
					],
				},
				{
					test: /.svg$/,
					use: [
						{
							loader: "svg-react-loader",
						},
					],
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						"css-loader",
					],
				},
			],
		},
		externals,
		optimization: {
			runtimeChunk: {
				name: "commons",
			},
		},
	};

	const config = [
		{
			...base,
			entry: {
				...mainEntry,
				"styled-components": "./js/src/externals/styled-components.js",
				redux: "./js/src/externals/redux.js",
				jed: "./js/src/externals/jed.js",
				"draft-js": "./js/src/externals/draft-js.js",
			},
			externals: {
				...externals,
				...yoastExternals,
				...wordpressExternals,
			},
			plugins: addBundleAnalyzer( [
				...plugins,
			] ),
		},

		// Config for components, which doesn't need all '@yoast' externals.
		{
			...base,
			entry: {
				components: "./js/src/externals/components.js",
			},
			output: {
				path: path.resolve(),
				filename: "js/dist/[name]-" + pluginVersionSlug + ".js",
				jsonpFunction: "yoastWebpackJsonp",
			},
			externals: {
				...externals,
				...wordpressExternals,
			},
			plugins: addBundleAnalyzer( [
				...plugins,
			] ),
			optimization: {
				runtimeChunk: false,
			},
		},
		// Config for files that should not use any externals at all.
		{
			...base,
			output: {
				path: paths.jsDist,
				filename: "[name]-" + pluginVersionSlug + ".js",
				jsonpFunction: "yoastWebpackJsonp",
			},
			entry: {
				"babel-polyfill": "./js/src/externals/babel-polyfill.js",
			},
			plugins: addBundleAnalyzer( plugins ),
			optimization: {
				runtimeChunk: false,
			},
		},
		// Config for the analysis web worker.
		{
			...base,
			externals: {},
			output: {
				path: paths.jsDist,
				filename: outputFilename,
				jsonpFunction: "yoastWebpackJsonp",
			},
			entry: {
				"analysis-worker": "./js/src/analysis-worker.js",
				analysis: "./js/src/externals/analysis.js",
			},
			plugins: addBundleAnalyzer( plugins ),
			optimization: {
				runtimeChunk: false,
			},
		},
		// Config for files that should only use externals available in the web worker context.
		{
			...base,
			externals: { yoastseo: "yoast.analysis" },
			entry: {
				"used-keywords-assessment": "./js/src/used-keywords-assessment.js",
			},
			plugins: addBundleAnalyzer( plugins ),
			optimization: {
				runtimeChunk: false,
			},
		},
	];

	if ( env.environment === "development" ) {
		config[ 0 ].devServer = {
			publicPath: "/",
			allowedHosts,
		};
	}

	return config;
};
