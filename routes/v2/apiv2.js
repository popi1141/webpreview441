import express from 'express';
var router = express.Router();
import fetch from 'node-fetch';
import cheerio from 'cheerio';
import mongoose from "mongoose";
import { promises as fs } from "fs";

main().catch(err => console.log(err));

let Post;

async function main() {
  await mongoose.connect('mongodb+srv://popi:ImPopiPenguin1141@cluster0.qemhz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');

  const postSchema = new mongoose.Schema({
    url: String,
    description: String,
    postedBy: String,
    created_date: Date
  });

  Post = mongoose.model('Post', postSchema);
}

/* Basic Endpoint */
router.get('/', function(req, res, next) {
  res.send('Input a url!');
});

/* POST posts handler */
router.post('/posts', async function(req, res, next) {
  console.log(req.body);
  try{
    const newPost = new Post({
      url: req.body.url,
      description: req.body.description,
      postedBy: req.body.postedBy,
      created_date: Date.now()
    });
    await newPost.save();
    res.json({ status: 'success' }) 
  }catch(error){
    res.json({ status: 'error:' + error })
  }
});

/* GET posts handler */ 
router.get('/posts', async function(req, res, next) {
  let allPosts = await Post.find();
  let results = [];
  try {
    for (var i = 0; i < allPosts.length; i++) {
      results.push({
          description: allPosts[i].description,
          postedBy: "| Posted By:" + allPosts[i].postedBy,
          htmlPreview: await generatePreview(allPosts[i].url)
      });
  }
    res.send(results);
  }
  catch (error) {
    res.send("error info:" + error);
  }
});

/* Async URL Preview Generator */ 
async function generatePreview(url) {
  const html = await fetch(url).then(res => res.text());
  const $ = cheerio.load(html);

  /* Grabs Meta Tags Based on Cheerio */
  const getMetaTags = (name) =>  {
    let data = (
      $(`meta[name=${name}]`).attr('content') ||
      $(`meta[name="og:${name}"]`).attr('content') ||
      $(`meta[name="twitter:${name}"]`).attr('content') ||
      $(`meta[property=${name}]`).attr('content') ||
      $(`meta[property="og:${name}"]`).attr('content') ||
      $(`meta[property="twitter:${name}"]`).attr('content')
    )
    if (data) {
      return escapeHTML(data)
    }
    return data;
  }

  const escapeHTML = str => str.replace(/[&<>'"]/g, 
  tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag]));

    
  /* Collates the Relevant Meta Tag Information */
  const metaTagData = {
    url: getMetaTags('url') || url,
    title: getMetaTags('title') || $(`title`).text() || url,
    img: getMetaTags('image'),
    description: getMetaTags('description'),
  }

  var fbPixelTag = `<p> No FB Pixel! </p>`

  /* Checks If FB Pixel is Present */
  var scripts = $('script').filter(function() {
    return ($(this).html().indexOf('https://connect.facebook.net/en_US/fbevents.js') > -1);
  });

  if (scripts.length > 0) {
    fbPixelTag = `<p> FB Pixel Tag Present! </p>`
  }

  var upperAhref = (metaTagData.url) ? `<a href="` + metaTagData.url + `">` : `<a href="#">`;
  var imgTag = (metaTagData.img) ? `<img src="` + metaTagData.img + `" style="max-height: 200px; max-width: 270px;">` : "";
  var descriptionTag = (metaTagData.description) ? `<p color:white>` + metaTagData.description +`</p>` : "";
  let htmlOutput = `<div style="max-width: 300px; border: solid 1px; padding: 3px; text-align: center; background-color:#171717; color:white; margin-top: 10px">
      ${upperAhref}
        <p><strong>${metaTagData.title}</strong></p>
        ${imgTag}
      </a>
      ${descriptionTag}
      ${fbPixelTag}
    </div>`
  return htmlOutput;
}

/* GET Url Preview Endpoint */ 
router.get('/previewurl', async function(req, res) {
  const previewUrl = req.query.url;
  try{
    let htmlOutput = await generatePreview(previewUrl)
    res.setHeader('Content-type','text/html')
    res.send(htmlOutput);
  } catch(error){
    res.send("error info:" + error);
  }
});

/* POST Url Preview Endpoint */ 
router.post('/previewurl', async function(req, res, next) {
  const { previewUrl } = req.body;
  try{
    let htmlOutput = await generatePreview(previewUrl);
    res.setHeader('Content-type','text/html')
    res.send(htmlOutput);
  } catch(error){
    res.send("error info:" + error);
  }
});

export default router;
