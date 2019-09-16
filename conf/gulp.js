var paths = {
	start: './bin/www',
	views: './views/*.pug',
	public: './public/**/*.*',
	css: './public/css/*.css'
}

module.exports = {
	browserSync: {
		files: [paths.public, paths.views],
		proxy: 'http://localhost:8888',
		port: 4000,
		open: 'local',
		ghostMode: { // sync only location
			clicks: false,
			forms: false,
			scroll: false
		}
	},
	nodemon: {
		script: paths.start,
		ext: 'js css sass pug',
		ignore: ['node_modules', './views', 'sass', 'public'],
		env: {
			NODE_ENV: 'development'
		}
	}
}
