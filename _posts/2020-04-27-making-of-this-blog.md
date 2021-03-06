---
title: Making-of this blog
tags:
  - frontend
  - devops
---
**Update 2022-07-13:**
This post is about a [previous version of this site](https://gitlab.com/kessl/blog/){:target="_blank"}.
The [current version](https://github.com/kessl/blog){:target="_blank"} is generated with Jekyll using a custom GitHub action and hosted on GitHub pages.

**Old TL;DR**
You're looking at a static site generated by Next.js, hosted on GitLab pages.

I wanted a place to store thoughts and ideas.
This site is the overengineered result of procrastinating from actually writing the content.

## Why Next.js?

A static site was an obvious choice.
The content won’t change very often, it’s fast, I can host it on `Git(Lab|Hub)` pages for free.
There are dedicated static site generators like Gatsby, but I decided to go with Next's static HTML export (introduced in Next 9.3).
Next has a lot of awesome features that make development (and writing posts locally) much easier, like out of the box support for hot reloading and CSS modules.

~~The result is an SPA with a 73 KB first load. Subsequent page transitions are client-side and only fetch JSON data.
Still works flawlessly with Javascript turned off.~~

<a name="no-js">_Update 2021-01-15:_</a> I found an [unstable Next.js page-level config option](https://github.com/vercel/next.js/pull/11949){:target="_blank"} to turn off all runtime JS.
The result is 7.54 KB transferred (compressed) on first load.

```ts
export const config = {
  unstable_runtimeJS: false,
}
```

### How this works

Next.js pages fetch data from Markdown files at build time with the use of [`getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-static-generation){:target="_blank"}.
Next exports all pages static and dynamic (as defined in [`getStaticPaths`](https://nextjs.org/docs/basic-features/data-fetching#getstaticpaths-static-generation){:target="_blank"}) as HTML files which I deploy to GitLab pages through a CI pipeline.

### Try it for yourself

Clone [`https://gitlab.com/kessl/blog`](https://gitlab.com/kessl/blog){:target="_blank"}, install, add a new post, run dev server.

```shell
$ git clone https://gitlab.com/kessl/blog
$ cd blog && yarn install
$ yarn add-post "New post title" tag tag2 ... # add a new post
$ yarn dev
```

You can continue editing the newly created post in `posts/new-post-title.md`.
Once you're done writing, commit the changes and push to GitLab to deploy the piece to pages.

If you'd like to base your own site on this without the color scheme and posts, clone a more barebones version from `v1.1.0`:

```shell
$ git clone --branch v1.1.0 --single-branch https://gitlab.com/kessl/blog
$ cd blog && git switch -c master
```

## Deploying to GitLab pages

The deploy to GitLab pages was pretty straightforward.
I ended up with 3 stages in the pipeline:

- install dependencies
- build & export HTML (needs git installed to determine last commit date per post)
- gzip, copy to `public` folder, deploy to pages

GitLab pages can serve gzip and brotli [compressed files](https://gitlab.com/gitlab-org/gitlab-pages/-/merge_requests/25){:target="_blank"}, if you pre-compress them prior to deploying.
See the pipeline config in [`.gitlab.ci`](https://gitlab.com/kessl/blog/-/blob/master/.gitlab-ci.yml#L49){:target="_blank"} for how I did it here.

I'm using a [simple Cloudflare worker](https://gist.github.com/kessl/d5ec24894833f7af5d10101128145b0d){:target="_blank"} to add basic security headers.

## That's it!

I'm pretty happy with the setup.
I find writing in Markdown very convenient, the site is fast ~~(landing page is 73 KB gzipped, 212 KB uncompressed), responsive and works with Javascript off.~~
(landing page is 7.54 KB brotli, 29.56 KB uncompressed) and there's no JS.

What I'm missing is some sort of usage statistics.
GitLab unfortunately does not provide any access logs for pages, and I'm not going to ruin a static site with a JS tracking script.
A tracking pixel would work but still need to be hosted somewhere.

_Update: I got around to setting up a [GoAccess tracking pixel](/static-site-analytics-with-nginx-goaccess-no-js){:target="_blank"}._
