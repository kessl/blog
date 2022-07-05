---
title: Static site analytics with Nginx, GoAccess & no JS
---
I've been using Cloudflare analytics to get an idea if anyone visits this site
Cloudflare tells me the number of requests, unique visitors and used bandwidth.
Better than nothing, considering it's free and works out of the box (if you manage DNS with Cloudflare).
But there's only 30 days of history, I don't know how many of the visits are crawlers and what pages the visitors request.

![Screenshot of Cloudflare analytics](/assets/images/cloudflare-analytics.png)

I've been wanting to give [GoAccess](https://goaccess.io/) a try for some time.
GoAccess provides real-time analytics by parsing access logs of your server.
It works entirely server-side and it's in my opinion the most privacy-conscious analytics solution, because it only collects what the browser explicitly sends to the server.
There's a slight problem though -- I host this site on [Gitlab pages](/gitlab-pages-dev-env) and [there's no server](https://www.yourofficeanywhere.co.uk/wp-content/uploads/2019/07/Cloud-Definitionn-2.png).

## Enter the tracking pixel

A tracking pixel is a 1x1 transparent pixel made infamous by Facebook, who use it to track people across third party sites.
I'll use the same technique here thanks to excellent writeups by [Ben Hoyt](https://benhoyt.com/writings/replacing-google-analytics/) and [Tim Nash](https://timnash.co.uk/pixel-tracking-with-nginx-a-tiny-bit-of-javascript/).

This is the plan:

- set up an Nginx instance to serve a pixel
- include the pixel on every page of this site
- parse Nginx's access log with GoAccess and get beautiful analytics

To get any useful information out of the pixel request, we'll need to add the data we want to log to the pixel's query string.
Ben and Tim used a tiny script to add the pixel to their pages, which sends over the current URL and the referrer.
Since I've [liberated](/making-of-this-blog#no-js) this site from Javascript some time ago, I won't be using any scripts.
Instead I'll generate the pixel markup at build time, baking the current URL into the pixel request like this: `cat.gif?u=<current-url>`.
This way I won't need any runtime JS, but there will be no referrer data.
Good enough for me.

## Serving the pixel

We'll tell Nginx to serve an empty gif at the path `/cat.gif`.
(Originally I used `t.gif` but it got blocked by EasyPrivacy.)

```nginx
location = /cat.gif {
    empty_gif;
    access_log /var/log/nginx/pixel.log;
}
```

If we parsed `pixel.log` with GoAccess, we would see a bunch of requests to `/cat.gif`.
We'll need to change the log format to use the `u` query param as the request URL.

```nginx
events {}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;

    # goaccess-compatible pixel log format
    log_format pixel '$remote_addr - $remote_user [$time_local] "$rurl" $status $body_bytes_sent "" "$http_user_agent" "$http_x_forwarded_for"';

    server {
        listen 8080;
        server_name localhost t.bitgate.cz;

        # tracking pixel
        location = /cat.gif {
            empty_gif;
            set $rurl $arg_u;
            access_log /var/log/nginx/pixel.log pixel;
        }
    }
}
```

Let's save this as `nginx.conf` and run Nginx from the same directory as the config:

```bash
$ docker run -it --rm -p 8080:8080 \
  -v ${PWD}/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v ${PWD}/log:/var/log/nginx nginx:alpine
```

If you open [`http://localhost:8080/cat.gif`](http://localhost:8080/cat.gif), there should be a record like the following in the pixel's log:

```bash
$ cat log/pixel.log
172.17.0.1 - - [14/Mar/2021:21:13:15 +0000] "" 200 43 "" "Mozilla/5.0 (Windows NT 10.0; rv:78.0) Gecko/20100101 Firefox/78.0" "-"
```

_It's funny and sad that Firefox on OSX with resist fingerprinting on pretends it runs on Windows and is **8&nbsp;versions** old._

## Parsing logs with GoAccess

Create a config and run GoAccess:

```bash
$ mkdir goaccess
$ vi goaccess/goaccess.conf
```

```conf
log-format COMBINED
log-file /goaccess/access.log
output /goaccess/index.html
real-time-html true
```

```bash
$ docker run -it --rm -p 7890:7890 \
  -v ${PWD}/goaccess:/goaccess \
  -v ${PWD}/log/pixel.log:/goaccess/access.log \
  allinurl/goaccess --config-file=/goaccess/goaccess.conf
```

Open `goaccess/index.html` in your browser and there it is!
If you make another request for `/cat.gif`, the report should update in real time.

![Screenshot of GoAccess report](/assets/images/goaccess-report.png)

## Compose for deployment

I want to deploy this to my Raspberry at home, so I'll need a way to access the report over the network.
We already have an Nginx up and running; let's add a `server` section to serve the report on another port so that I can port forward only the pixel:

```nginx
server {
    listen 8081;
    server_name localhost;

    # goaccess report
    root /var/www;
}
```

To have it work with the docker command from earlier, we need to map the report to `/var/www` and expose port 8081:

```bash
-v ${PWD}/goaccess/index.html:/var/www/index.html -p 8081:8081
```

You should now find the report at [`http://localhost:8081`](http://localhost:8081).

To make deployment easier, I created a `docker-compose.yml`.
I mapped the ports differently so that the pixel is available at port 80, 7890 is GoAccess's default websocket port and 7891 is the report.
`--ignore-panel`s hide sections we don't have data for.

I added a Let's Encrypt config to enable HTTPS.
Without HTTPS, the numbers would be skewed, because recent versions of Chrome will not load mixed content.
See the [readme](https://github.com/kessl/static-pixel-tracking) for the necessary steps to get it all up and running.

```yaml
version: '3.8'

services:
  goaccess:
    container_name: goaccess
    image: memphisx/rpi-goaccess
    command: --config-file=/goaccess/goaccess.conf --ignore-panel=REQUESTS_STATIC --ignore-panel=REFERRERS --ignore-panel=REFERRING_SITES --ignore-panel=KEYPHRASES --ignore-panel=STATUS_CODES --ignore-panel=NOT_FOUND
    environment:
      - TZ=Europe/Prague
    volumes:
      - ${PWD}/goaccess:/goaccess
      - ${PWD}/log:/log
    ports:
      - 7890:7890 # goaccess websocket

  goaccess-nginx:
    container_name: goaccess-nginx
    command: '/bin/sh -c ''while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g "daemon off;"'''
    volumes:
      - ${PWD}/nginx.conf:/etc/nginx/nginx.conf:ro
      - ${PWD}/log:/var/log/nginx
      - ${PWD}/goaccess/html:/var/www
      - ${PWD}/certbot/conf:/etc/letsencrypt
      - ${PWD}/certbot/www:/var/www/certbot
    image: tobi312/rpi-nginx:alpine
    ports:
      - 80:80 # certbot
      - 443:443 # tracking pixel
      - 7891:8081 # goaccess report

  goaccess-certbot:
    container_name: goaccess-certbot
    image: certbot/certbot:arm32v6-latest
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
```

## Embed the pixel

I added this component to my layout to appear in every page.

```tsx
import { useRouter } from 'next/dist/client/router'

const PIXEL_URL = 'https://t.bitgate.cz/cat.gif?u='

export const Pixel: React.FC = () => {
  const router = useRouter()
  const currentUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}${router.asPath}`)

  return (
    <img
      src={`${PIXEL_URL}${currentUrl}`}
      decoding="async"
      loading="eager"
      style={{ "{{ visibility: 'hidden' " }}}}
    />
  )
}
```

That's it!
