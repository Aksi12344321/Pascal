const gulp = require("gulp");
const fileInclude = require("gulp-file-include");
const sass = require("gulp-sass")(require("sass"));
const sassGlob = require("gulp-sass-glob");
const clean = require("gulp-clean");
const fs = require("fs");
const sourceMaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const webpack = require("webpack-stream");
const babel = require("gulp-babel");
const changed = require("gulp-changed");
const typograf = require("gulp-typograf");
const replace = require("gulp-replace");
const imagemin = require("gulp-imagemin");
const imageminWebp = require("imagemin-webp");
const rename = require("gulp-rename");
const svgsprite = require("gulp-svg-sprite");
const htmlclean = require("gulp-htmlclean");
const groupMedia = require("gulp-group-css-media-queries");
const autoprefixer = require("gulp-autoprefixer");
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const merge = require("merge-stream");
const path = require("path");
const through2 = require("through2");
const cheerio = require("cheerio");

// Кастомный плагин из dev.js для замены webpHTML
function addRetinaWebp(buildDir) {
  return through2.obj(function(file, _, cb) {
    if (file.isBuffer()) {
      const html = file.contents.toString();
      const $ = cheerio.load(html, { decodeEntities: false });

      $("img").each((i, el) => {
        const $img = $(el);
        const src = $img.attr("src");

        if (!src || !src.match(/\.(png|jpe?g)$/i)) return;

        const filePath = path.join(buildDir, src);
        const retinaPath = filePath.replace(/(\.[a-z]+)$/i, "@2x$1");

        let hasRetina = false;
        try {
          fs.accessSync(retinaPath);
          hasRetina = true;
        } catch (e) {}

        const ext = path
          .extname(src)
          .slice(1)
          .toLowerCase();
        const srcWebp = src.replace(/\.(png|jpe?g)$/i, ".webp");
        const retinaWebp = src.replace(/\.(png|jpe?g)$/i, "@2x.webp");
        const retinaSrc = src.replace(/(\.[a-z]+)$/i, "@2x$1");

        const picture = $("<picture></picture>");

        if (hasRetina) {
          picture.append(`<source srcset="${srcWebp} 1x, ${retinaWebp} 2x" type="image/webp">`);
          picture.append(`<source srcset="${src} 1x, ${retinaSrc} 2x" type="image/${ext}">`);
        } else {
          picture.append(`<source srcset="${srcWebp}" type="image/webp">`);
        }

        $img.attr("loading", "lazy");
        picture.append($img.clone());
        $img.replaceWith(picture);
      });

      file.contents = Buffer.from($.html());
    }
    cb(null, file);
  });
}

gulp.task("clean:docs", function(done) {
  if (fs.existsSync("./docs/")) {
    return gulp.src("./docs/", { read: false }).pipe(clean({ force: true }));
  }
  done();
});

const fileIncludeSetting = {
  prefix: "@@",
  basepath: "@file",
};

const plumberNotify = (title) => ({
  errorHandler: notify.onError({
    title: title,
    message: "Error <%= error.message %>",
    sound: false,
  }),
});

gulp.task("html:docs", function() {
  return (
    gulp
      .src(["./src/html/**/*.html", "!./**/blocks/**/*.*", "!./src/html/docs/**/*.*"])
      .pipe(changed("./docs/"))
      .pipe(plumber(plumberNotify("HTML")))
      .pipe(fileInclude(fileIncludeSetting))
      .pipe(replace(/\u00A0/g, " "))
      .pipe(replace(/&nbsp;/g, " "))
      .pipe(replace(/<img(?:.|\n|\r)*?>/g, (match) => match.replace(/\r?\n|\r/g, "").replace(/\s{2,}/g, " ")))
      .pipe(replace(/(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi, "$1./$4$5$7$1"))
      .pipe(
        typograf({
          locale: ["ru", "en-US"],
          htmlEntity: { type: "digit" },
          safeTags: [
            ["<\\?php", "\\?>"],
            ["<no-typography>", "</no-typography>"],
          ],
        })
      )
      // Используем кастомный плагин вместо webpHTML
      .pipe(addRetinaWebp(path.resolve(__dirname, "../docs")))
      .pipe(htmlclean())
      .pipe(gulp.dest("./docs/"))
  );
});

gulp.task("sass:docs", function() {
  return gulp
    .src("./src/scss/main.scss")
    .pipe(changed("./docs/css/"))
    .pipe(plumber(plumberNotify("SCSS")))
    .pipe(sourceMaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(groupMedia())
    .pipe(autoprefixer())
    .pipe(replace(/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi, "$1$2$3$4$6$1"))
    .pipe(postcss([cssnano()]))
    .pipe(sourceMaps.write())
    .pipe(gulp.dest("./docs/css/"));
});

gulp.task("images:docs", function() {
  const originals = gulp
    .src(["./src/img/**/*", "!./src/img/svgicons/**/*"], { nodir: true })
    .pipe(changed("./docs/img/"))
    .pipe(gulp.dest("./docs/img/"));

  const webps = gulp
    .src(["./src/img/**/*", "!./src/img/svgicons/**/*"], { nodir: true })
    .pipe(changed("./docs/img/", { extension: ".webp" }))
    .pipe(
      imagemin([
        imageminWebp({
          quality: 85,
        }),
      ])
    )
    .pipe(rename({ extname: ".webp" }))
    .pipe(gulp.dest("./docs/img/"));

  return merge(originals, webps);
});

const svgStack = {
  mode: {
    stack: {
      example: true,
    },
  },
};

const svgSymbol = {
  mode: {
    symbol: {
      sprite: "../sprite.symbol.svg",
    },
  },
  shape: {
    transform: [
      {
        svgo: {
          plugins: [
            {
              name: "removeAttrs",
              params: {
                attrs: "(fill|stroke)",
              },
            },
          ],
        },
      },
    ],
  },
};

gulp.task("svgStack:docs", function() {
  return gulp
    .src("./src/img/svgicons/**/*.svg")
    .pipe(plumber(plumberNotify("SVG:docs")))
    .pipe(svgsprite(svgStack))
    .pipe(gulp.dest("./docs/img/svgsprite/"));
});

gulp.task("svgSymbol:docs", function() {
  return gulp
    .src("./src/img/svgicons/**/*.svg")
    .pipe(plumber(plumberNotify("SVG:docs")))
    .pipe(svgsprite(svgSymbol))
    .pipe(gulp.dest("./docs/img/svgsprite/"));
});

gulp.task("files:docs", function() {
  return gulp
    .src("./src/files/**/*")
    .pipe(changed("./docs/files/"))
    .pipe(gulp.dest("./docs/files/"));
});

gulp.task("js:docs", function() {
  return gulp
    .src("./src/js/*.js")
    .pipe(changed("./docs/js/"))
    .pipe(plumber(plumberNotify("JS")))
    .pipe(babel())
    .pipe(webpack(require("./../webpack.config.js")))
    .pipe(gulp.dest("./docs/js/"));
});

const server = require("gulp-server-livereload");
const serverOptions = {
  livereload: true,
  open: true,
};

gulp.task("server:docs", function() {
  return gulp.src("./docs/").pipe(server(serverOptions));
});
