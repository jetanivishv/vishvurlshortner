require('dotenv').config();
const express = require('express');
const cors = require('cors');
var validUrl = require('valid-url');
const mongoose = require('mongoose');
const mongodb = require('mongodb').MongoClient;
const shortid = require('shortid')
const bodyParser= require('body-parser');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended:false
}));

app.use(express.static(`${__dirname}/public`))

mongoose.connect(process.env.MONGO_URI,{
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url:{
    type:String,
    required:true
  },
  short_url:{
    type:String,
    required:true,
    default:0
  }
});

const Url=mongoose.model("Url",urlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl',async function(req,res){
  const url=req.body.url;

  if(!validUrl.isWebUri(url)){
    res.json({
      error: 'Invalid URL'
    })
  }
  else{
    try{
      let findOne = await Url.findOne({
        original_url:url
      })
      if(findOne){
        res.json({ 
          original_url:findOne.original_url,
          short_url:findOne.short_url
        })
      }
      else{
        Url.estimatedDocumentCount(async function(countErr, count){
          if (countErr) {
            res.send('estimatedDocumentCount() error');
          }
          findOne=new Url({
            original_url:url,
            short_url:count+1
          })
          await findOne.save()
          res.json({
            original_url:findOne.original_url,
            short_url:findOne.short_url
          })
        })
      }
    }
    catch(err){
      console.error(err)
      res.status(500).json('Server Error')
    }
  }
})

app.get('/api/shorturl/:short_url', async function(req, res){
  try{
    const urlParams=await Url.findOne({
      short_url:req.params.short_url
    })
    if(urlParams){
      return res.redirect(urlParams.original_url) 
    }
    else{
      return res.status(404).json('No URL found')
    }
  }
  catch(err){
    console.error(err)
    res.status(500).json('Server Error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
