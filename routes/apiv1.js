import express from 'express';
var router = express.Router();
import fetch from 'node-fetch';
import cheerio from 'cheerio';

/* Basic Endpoint */
router.get('/', function(req, res, next) {
  res.send('Input a url!');
});

/* Url Preview Endpoint */ 
router.post('/previewurl', async function(req, res, next) {
  const { previewUrl } = req.body;
  try{
    const html = await fetch(previewUrl).then(res => res.text());
    const $ = cheerio.load(html);
    /* Grabs Meta Tags Based on Cheerio */
    const getMetaTags = (name) =>  {
      return(
        $(`meta[name=${name}]`).attr('content') ||
        $(`meta[name="og:${name}"]`).attr('content') ||
        $(`meta[name="twitter:${name}"]`).attr('content') ||
        $(`meta[property=${name}]`).attr('content') ||
        $(`meta[property="og:${name}"]`).attr('content') ||
        $(`meta[property="twitter:${name}"]`).attr('content')
      );
    }
    /* Collates the Relevant Meta Tag Information */
    const metaTagData = {
      url: getMetaTags('url') || previewUrl,
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

    res.setHeader('Content-type','text/html')
    res.send(htmlOutput);
  } catch(error){
    res.send("error info:" + error);
  }
});

export default router;
