const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const request = require("request");
const mongojs = require("mongojs");
const db = require("./models");

const PORT = 3000;

const app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

var databaseUrl = "scraper";
var collections = ["scrapedData"];

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

var dbmongo = mongojs(databaseUrl, collections);
dbmongo.on("error", function(error) {
  console.log("Database Error:", error);
});

app.get("/scrape", function(req, res) {

  request("https://www.reddit.com/", function(error, response, html) {

    var $ = cheerio.load(html);

    $(".title").each(function(i, element) {
      var title = $(element).children("a").text();
      var link = $(element).children("a").attr("href");

      if (title && link) {
        dbmongo.Article.insert({
          title: title,
          link: link
        },
        function(err, inserted) {
          if (err) {
            console.log(err);
          }
          else {
            console.log(inserted);
          }
        });
      }
    });
  });
  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
  dbmongo.Article.find({}, function(error, found) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(found);
    }
  });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        note: dbNote._id
      }, {
        new: true
      });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
