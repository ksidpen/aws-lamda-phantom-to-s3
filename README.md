serverless-html-pdf
===================

This lambda function takes a HTML page and convert it into printable PDF using PhantomJS

### Setup

create *env.yml* for env vars
``` yaml
dev:
  AWS_ACCESS_KEY_ID:     ABCDEFGH
  AWS_SECRET_ACCESS_KEY: ABC
  BUCKET_NAME:           MABUKIT-BETA

production:
  BUCKET_NAME:           MABUKIT-PROD
```

For deployment
```
serverless deploy
```

### Development
requires [ghostscript](https://www.ghostscript.com/)

```
serverless offline start
```
or test a function
```
serverless webpack invoke --function print  --path event.json -s dev
```
or get log tail
```
serverless logs -f print -s dev
```
