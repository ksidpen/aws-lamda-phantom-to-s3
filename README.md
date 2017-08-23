serverless-html-pdf
===================

This lambda function takes a HTML page and convert it into printable PDF using PhantomJS and the rasterize script packaged in the PhantomJS examples.

### Setup

create *env.yml* for env vars
``` yaml
BUCKET_KEY:           ABVDE
BUCKET_KEY_ID:        FGHSD
BUCKET_NAME:          NICEBUKIT
```

For deployment
```
serverless deploy
```

### Development
```
serverless offline start
```
or test a function
```
serverless webpack invoke --function print  --path event.json
```
