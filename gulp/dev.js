const gulp = require("gulp");
const fileInclude = require("gulp-file-include");
const sass = require("gulp-sass")(require("sass"));
const sassGlob = require("gulp-sass-glob");
const server = require("gulp-server-livereload");
const clean = require("gulp-clean");
const fs = require("fs");
const sourceMaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const webpack = require("webpack-stream");
const babel = require("gulp-babel");
const imagemin = require("gulp-imagemin");
const changed = require("gulp-changed");
const typograf = require("gulp-typograf");
const svgsprite = require("gulp-svg-sprite");
const replace = require("gulp-replace");
// const webpHTML = require("gulp-webp-retina-html"); // Убираем
const imageminWebp = require("imagemin-webp");
const rename = require("gulp-rename");
const prettier = require("@bdchauvette/gulp-prettier");

const through2 = require("through2");
const cheerio = require("cheerio");
const path = require("path");
const merge = require("merge-stream");

// Кастомный плагин, который заменяет webpHTML
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
        } catch (e) {
          // 2x нет — не добавляем
        }

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

gulp.task("clean:dev", function(done) {
  if (fs.existsSync("./build/")) {
    return gulp.src("./build/", { read: false }).pipe(clean({ force: true }));
  }
  done();
});

const fileIncludeSetting = {
  prefix: "@@",
  basepath: "@file",
};

const plumberNotify = (title) => {
  return {
    errorHandler: notify.onError({
      title: title,
      message: "Error <%= error.message %>",
      sound: false,
    }),
  };
};

gulp.task("html:dev", function() {
  return (
    gulp
      .src(["./src/html/**/*.html", "!./**/blocks/**/*.*", "!./src/html/docs/**/*.*"])
      .pipe(changed("./build/", { hasChanged: changed.compareContents }))
      .pipe(plumber(plumberNotify("HTML")))
      .pipe(fileInclude(fileIncludeSetting))
      .pipe(replace(/\u00A0/g, " "))
      .pipe(replace(/&nbsp;/g, " "))
      .pipe(
        replace(/<img(?:.|\n|\r)*?>/g, function(match) {
          return match.replace(/\r?\n|\r/g, "").replace(/\s{2,}/g, " ");
        })
      ) //удаляет лишние пробелы и переводы строк внутри тега <img>
      .pipe(replace(/(?<=src=|href=|srcset=)(['"])(\.(\.)?\/)*(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi, "$1./$4$5$7$1"))

      .pipe(
        typograf({
          locale: ["ru", "en-US"],
          htmlEntity: { type: "digit" },
          safeTags: [
            ["<\\?php", "\\?>"],
            ["<no-typography>", "</no-typography>"],
          ],
          disableRule: ["ru/nbsp/afterShortWord", "ru/nbsp/afterNumber", "ru/nbsp/shortWord", "ru/nbsp/dots", "ru/nbsp/phone", "ru/nbsp/mathSign", "ru/nbsp/beforePercent", "ru/nbsp/afterParagraphMark"],
        })
      )
      // Заменяем webpHTML на кастомный плагин:
      .pipe(addRetinaWebp(path.resolve(__dirname, "../build")))
      .pipe(
        prettier({
          tabWidth: 4,
          useTabs: true,
          printWidth: 182,
          trailingComma: "es5",
          bracketSpacing: false,
        })
      )
      .pipe(gulp.dest("./build/"))
  );
});

gulp.task("sass:dev", function() {
  return gulp
    .src("./src/scss/*.scss")
    .pipe(changed("./build/css/"))
    .pipe(plumber(plumberNotify("SCSS")))
    .pipe(sourceMaps.init())
    .pipe(sassGlob())
    .pipe(sass())
    .pipe(replace(/(['"]?)(\.\.\/)+(img|images|fonts|css|scss|sass|js|files|audio|video)(\/[^\/'"]+(\/))?([^'"]*)\1/gi, "$1$2$3$4$6$1"))
    .pipe(sourceMaps.write())
    .pipe(gulp.dest("./build/css/"));
});

gulp.task("images:dev", function() {
  const originals = gulp
    .src(["./src/img/**/*", "!./src/img/svgicons/**/*"], { nodir: true })
    .pipe(changed("./build/img/"))
    .pipe(gulp.dest("./build/img/"));

  const webps = gulp
    .src(["./src/img/**/*", "!./src/img/svgicons/**/*"], { nodir: true })
    .pipe(changed("./build/img/", { extension: ".webp" })) // чтобы не перекрывать оригиналы
    .pipe(
      imagemin([
        imageminWebp({
          quality: 85,
        }),
      ])
    )
    .pipe(rename({ extname: ".webp" }))
    .pipe(gulp.dest("./build/img/"));

  return merge(originals, webps);
});

const svgStack = {
  mode: {
    stack: {
      example: true,
    },
  },
  shape: {
    transform: [
      {
        svgo: {
          js2svg: { indent: 4, pretty: true },
        },
      },
    ],
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
          js2svg: { indent: 4, pretty: true },
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

gulp.task("svgStack:dev", function() {
  return gulp
    .src("./src/img/svgicons/**/*.svg")
    .pipe(plumber(plumberNotify("SVG:dev")))
    .pipe(svgsprite(svgStack))
    .pipe(gulp.dest("./build/img/svgsprite/"));
});

gulp.task("svgSymbol:dev", function() {
  return gulp
    .src("./src/img/svgicons/**/*.svg")
    .pipe(plumber(plumberNotify("SVG:dev")))
    .pipe(svgsprite(svgSymbol))
    .pipe(gulp.dest("./build/img/svgsprite/"));
});

gulp.task("files:dev", function() {
  return gulp
    .src("./src/files/**/*")
    .pipe(changed("./build/files/"))
    .pipe(gulp.dest("./build/files/"));
});

gulp.task("js:dev", function() {
  return (
    gulp
      .src("./src/js/*.js")
      .pipe(changed("./build/js/"))
      .pipe(plumber(plumberNotify("JS")))
      // .pipe(babel())
      .pipe(webpack(require("./../webpack.config.js")))
      .pipe(gulp.dest("./build/js/"))
  );
});

const serverOptions = {
  livereload: true,
  open: true,
};

gulp.task("server:dev", function() {
  return gulp.src("./build/").pipe(server(serverOptions));
});

gulp.task("watch:dev", function() {
  gulp.watch("./src/scss/**/*.scss", gulp.parallel("sass:dev"));
  gulp.watch(["./src/html/**/*.html", "./src/html/**/*.json"], gulp.parallel("html:dev"));
  gulp.watch("./src/img/**/*", gulp.parallel("images:dev"));
  gulp.watch("./src/files/**/*", gulp.parallel("files:dev"));
  gulp.watch("./src/js/**/*.js", gulp.parallel("js:dev"));
  gulp.watch("./src/img/svgicons/*", gulp.series("svgStack:dev", "svgSymbol:dev"));
});
