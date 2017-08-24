serverless-html-pdf
===================

This lambda function takes a HTML page and convert it into printable PDF using PhantomJS and the rasterize script packaged in the PhantomJS examples.

### Setup

create *env.yml* for env vars
``` yaml
AWS_ACCESS_KEY_ID:     ABCDEFGH
AWS_SECRET_ACCESS_KEY: ABC
BUCKET_NAME:           MABUKIT
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
