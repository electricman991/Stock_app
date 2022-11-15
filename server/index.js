const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Pusher = require('pusher');
const PushNotifications = require('@pusher/push-notifications-server');

// initialise express
const app = express();
const pusher = new Pusher(require('./config.js'));
const pushNotifications = new PushNotifications(require('./config.js'))

const request = require('request');

const options = {
    method: 'GET',
    url: 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=GOOG,AAPL,AMZN',
    
  };
  
  request(options, function (error, response, body) {
      if (error) throw new Error(error);

      // console.log(body);
      var obj = JSON.parse(body);
      //console.log(obj.quoteResponse.result[0].regularMarketPrice);

      function handleStock(req, res, stock) {
        
        let sendToPusher = setInterval(() => {
            
            if (stock === 'google') {
                var currentValue = obj.quoteResponse.result[0].regularMarketPrice;
                var changePercent = obj.quoteResponse.result[0].regularMarketChangePercent;
                var pevalue = obj.quoteResponse.result[0].trailingPE;
                var stockName = 'Google';
            }
            if (stock === 'apple') {
                var currentValue = obj.quoteResponse.result[1].regularMarketPrice;
                var changePercent = obj.quoteResponse.result[1].regularMarketChangePercent;
                var pevalue = obj.quoteResponse.result[1].trailingPE;
                var stockName = 'Apple';
            }
            if (stock === 'amazon') {
                var currentValue = obj.quoteResponse.result[2].regularMarketPrice;
                var changePercent = obj.quoteResponse.result[2].regularMarketChangePercent;
                var pevalue = obj.quoteResponse.result[2].trailingPE;
                var stockName = 'Amazon';
            }
            
            var changePercent = changePercent.toFixed(2);
            const price = currentValue.toString()
            var pe = (parseFloat(pevalue).toFixed(2));
            
    
            // Send to pusher
            pusher.trigger('stock-channel', stockName, {currentValue, changePercent, pe})
    
            pushNotifications.publishToInterests(
                ['stocks'],{
                fcm: {
                  notification: {
                    title: stockName,
                    body: `The new value for ${stockName} is: ${price}`
                  }
                }
              }).then((publishResponse) => {
                console.log('Just published:', publishResponse.publishId);
              });
    
            
              clearInterval(sendToPusher)
            
        }, 2000);
        
        res.json({success: 200})
    }
    
    app.get('/stock/google', (req, res) => handleStock(req, res, 'google'));
    app.get('/stock/apple', (req, res) => handleStock(req, res, 'apple'));
    app.get('/stock/amazon', (req, res) => handleStock(req, res, 'amazon'));
    

  });

const port = 5000;
    
app.listen(port, () => console.log(`Server is running on port ${port}`));