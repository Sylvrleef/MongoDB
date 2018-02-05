const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const request = require("request")
const db = require("./models");

const PORT = 3000;

const app = express();

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static("public"));

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

app.get("/scrape", function(req, res) {

  request("https://www.reddit.com/", function(error, response, html) {

    var $ = cheerio.load(html);

    var results = [];

    $("p.title").each(function(i, element) {

      var title = $(element).text();

      var link = $(element).children().attr("href");

      results.push({
        title: title,
        link: link
      });
    });
    console.log(results);
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({
      _id: req.params.id
    })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
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
