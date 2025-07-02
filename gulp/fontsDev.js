const gulp = require("gulp");
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const fonter = require("gulp-fonter-fix");
const ttf2woff2 = require("gulp-ttf2woff2");
const fs = require("fs");
const path = require("path");

const srcFolder = "./src";
const buildFolder = "./build";

function otfToTtf() {
  return gulp
    .src(`${srcFolder}/fonts/*.otf`, { allowEmpty: true })
    .pipe(plumber(notify.onError({ title: "FONTS OTF→TTF", message: "Error: <%= error.message %>" })))
    .pipe(fonter({ formats: ["ttf"] }))
    .pipe(gulp.dest(`${srcFolder}/fonts/`));
}

function ttfToWoff() {
  return gulp
    .src(`${srcFolder}/fonts/*.ttf`, { allowEmpty: true })
    .pipe(plumber(notify.onError({ title: "FONTS TTF→WOFF/WOFF2", message: "Error: <%= error.message %>" })))
    .pipe(fonter({ formats: ["woff"] }))
    .pipe(gulp.dest(`${buildFolder}/fonts/`))
    .pipe(gulp.src(`${srcFolder}/fonts/*.ttf`))
    .pipe(ttf2woff2())
    .pipe(gulp.dest(`${buildFolder}/fonts/`));
}

function copyWoff() {
  return gulp.src(`${srcFolder}/fonts/*.{woff,woff2}`, { allowEmpty: true }).pipe(gulp.dest(`${buildFolder}/fonts/`));
}

function fontsStyle(cb) {
  const fontsDir = `${buildFolder}/fonts/`;
  const styleFile = `${srcFolder}/scss/base/_fontsAutoGen.scss`;

  fs.readdir(fontsDir, (err, fontFiles) => {
    if (err || !fontFiles) return cb();

    const uniqueFonts = new Set();
    let content = "";

    fontFiles.forEach((file) => {
      const ext = path.extname(file);
      if (![".woff", ".woff2"].includes(ext)) return;

      const base = path.basename(file, ext);
      if (uniqueFonts.has(base)) return;
      uniqueFonts.add(base);

      const [fontName, weightName = "regular"] = base.split("-");
      const weightMap = {
        thin: 100,
        extralight: 200,
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
        black: 900,
      };
      const weight = weightMap[weightName.toLowerCase()] || 400;

      content += `@font-face {
  font-family: '${fontName}';
  font-display: swap;
  src: url("../fonts/${base}.woff2") format("woff2"),
       url("../fonts/${base}.woff") format("woff");
  font-weight: ${weight};
  font-style: normal;
}\n`;
    });

    fs.writeFile(styleFile, content, cb);
  });
}

gulp.task("fontsDev", gulp.series(otfToTtf, ttfToWoff, copyWoff, fontsStyle));
