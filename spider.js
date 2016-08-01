var https = require('https')
var cheerio = require('cheerio')
var EventEmitter = require('events').EventEmitter
var fs = require('fs')
var url = 'https://movie.douban.com/top250'
var path = require('path')

var movies = []

function filterMovieItem(html) {
    var $ = cheerio.load(html)
    var movieItems = $('.item')
    movieItems.each(function(item) {
        var movieItem = $(this)
        var movieTitle = movieItem.find('.title').text()
        var movieURL = movieItem.find('a').attr('href')
        var movieIntro = movieItem.find('.inq').text()
        var movieStar = movieItem.find('.rating_num').text()
        var moviePoster = movieItem.find('img').attr('src')
        console.log('movieTitle ' + movieTitle);
        console.log('movieURL ' + movieURL);
        console.log('movieIntro ' + movieIntro);
        console.log('movieStar ' + movieStar);
        console.log('moviePoster ' + moviePoster);
        var movieObject = {
            title: movieTitle,
            url: movieURL,
            intro: movieIntro,
            star: movieStar,
            poster: moviePoster,
        };
        if (movieObject) {
            movies.push(movieObject)
        }
    })
}

function saveMovieObject(movies) {
    var path = './DoubanMovieTop250.json'
    fs.writeFile(path, JSON.stringify(movies, null, ' '), function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('Data saved');
  });
}

function downloadMoviePoster(movies) {
    var localPath = './MoviePosters/'
    movies.forEach(function(item) {
        var url = item.poster
        https.get(url, function (res) {
            var data = '';
            res.setEncoding('binary');
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                fs.writeFile(localPath + path.basename(url), data, 'binary', function (err) {
                    if (err) {
                        return console.log('Image downloag error' + err);
                    }
                    console.log('Image downloaded: ', path.basename(url));
                });
            });
        }).on('error', function (err) {
            console.log(err);
        });
    })
}

function nextURL(html) {
    var $ = cheerio.load(html)
    var nextPageURLSuffix = $('.paginator').find('.next').find('a').attr('href')
    var nextPageURL = url + nextPageURLSuffix
    return nextPageURL
}

function load(url) {
    var request = https.get(url, function(res) {
        var html = ''

        res.on('data', function(data) {
            html += data
        })

        res.on('end', function() {
            filterMovieItem(html)
            var nextPageURL = nextURL(html)
            if (nextPageURL === url) {
                saveMovieObject(movies)
                downloadMoviePoster(movies)
            } else {
                load(nextPageURL)
            }
        })
    })

    request.on('error', function(error) {
        console.log('获取数据出错!' + error.stack + '\n' + 'error message ' + error.messages);
    })
}

load(url)
