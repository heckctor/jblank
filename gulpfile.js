const gulp = require('gulp'),


    //Plugins para FTP
    ftp = require('vinyl-ftp'),
    gutil = require('gulp-util'),

    //PLugins para compilar scss
    plumber = require('gulp-plumber'),
    sass = require('gulp-sass'),


    //PLugins Post CSS
    postcss = require('gulp-postcss'),
    cssnano = require('cssnano'),//autoprefixer

    //Concatenar JS
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),

    //comprimir JS
    uglifyjs = require('uglify-js'),
    minifier = require('gulp-uglify'),
    pump = require('pump');

var themeName = "jblank";



/* * * * *
Tarea: Compilar / Minificar Sass
* * * * */

//---> compilando archivos scss
gulp.task('sass', () =>
    gulp.src('./src/sass/**/*.scss')
        .pipe(plumber({
            errorHandler: function (error) {
                console.log(error.message);
                this.emit('end');
            }
        }))
        .pipe(sass())
        .pipe(gulp.dest('./src/dev/css/'))
);
//---> Fin scss


//---> PostCss
plugPostcss = [
    cssnano({
        autoprefixer: {
            add: true,
            browsers: 'last 2 versions'
        },
        core: true,
    })
];

gulp.task('postcss', () =>
    gulp.src('./src/dev/css/*.css')
        .pipe(postcss(plugPostcss))
        .pipe(gulp.dest('./'+themeName+'/assets/css/'))
);
//---> Fin PostCss

gulp.task('styles', function () {
    gulp.watch('./src/sass/**/*.scss', ['sass']);
    gulp.watch('./src/dev/css/*.css', ['postcss']);
});

// Fin Compilar / Minificar Sass




/* * * * *
Tarea: Optimizar Scripts
* * * * */

var jsFiles = [
  //Librerias
  'bower_components/jquery/dist/jquery.min.js', 
  
  //Codigo del sitio
  'src/js/app.js'
  ],  
    jsDest = './src/dev/js';

gulp.task('concat-js', function() {  
    return gulp.src(jsFiles)
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(jsDest));
});

//Comprimir JS
gulp.task('compress-js', function (cb) {
    pump([
        gulp.src('src/dev/js/*.js'),
        minifier(),
        gulp.dest('./'+themeName+'/assets/js')
    ],
        cb
    );
});

gulp.task('scripts', function() {
    gulp.watch(jsFiles, ['concat-js']);
    gulp.watch('src/dev/js/*.js', ['compress-js']);
});
//Fin Optimizar scripts


/* * * * *
Tarea: Conexion FTP
* * * * */
//Configuración de conexion



var user = process.env.FTP_USER = '';
var password = process.env.FTP_PWD = '';
var host = '';
var port = 21;
var dirLocales = [
    './' + themeName + '/*/**',
    './' + themeName +'/assets/*/*/**',
    './' + themeName +'/assets/*/**/*',
    './' + themeName +'/*',
    //omitir carpetas y archivos (anteponer simbolo !)
    '!./src',
    '!./bower_components',
    '!./node_modules',
    '!./.gitignore',
    '!./gulpfile.js',
    '!./package.json',
    '!./package-lock.json',
    '!./bower.json',
    '!./yarn.lock'
];
var dirRemoto = '/public_html/templates/'+themeName+'/';

//función auxiliar para construir una conexión FTP
//basada en nuestra configuración
function getFtpConnection() {
    return ftp.create({
        host: host,
        port: port,
        user: user,
        password: password,
        parallel: 50,
        maxConnections: 100,
        log: gutil.log
    });
}

/**
 * Implementando la tarea
 * Copia los archivos al servidor
 *
 */
gulp.task('upload', function () {
    var conn = getFtpConnection();
    return gulp.src(dirLocales, { base: './site', buffer: false })
        .pipe(conn.newer(dirRemoto)) // Sube todo
        .pipe(conn.dest(dirRemoto));
});
/**
  * Observa la copia local para los cambios y
  copia los nuevos archivos al servidor cada vez
  que se detecta un cambio
**/
gulp.task('ftp-changes', function () {
    var conn = getFtpConnection();
    gulp.watch(dirLocales)
        .on('change', function (event) {
            console.log('Cambios detectados! Subiendo Archivo "' + event.path + '", ' + event.type);
            return gulp.src([event.path], { base: './site', buffer: false })
                .pipe(conn.newer(dirRemoto)) // Solo sube archivos más recientes
                .pipe(conn.dest(dirRemoto));

        });
});

gulp.task('ftp', ['ftp-changes'], function () {

});
//---> Fin FTP

/* * * * *
Tarea: default
* * * * */
gulp.task('default', ['styles', 'scripts','ftp'], function () {
   
});