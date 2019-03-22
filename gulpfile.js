var gulp = require('gulp');

gulp.task('default', function(done) {
	gulp.src('src/**/*.*')
		.pipe(gulp.dest('builds'));
	done();
});
