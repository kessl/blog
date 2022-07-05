---
title: Content Security Policy, inline scripts and Next.js
---
**TL;DR** Use CSP with nonce & `strict-dynamic` to secure the origin of inline scripts.

_Updated 2021-02-17 for Helmet v4_

Next includes client-side scripts in `<script>` tags in `Document`, so usually, a `script-src 'self';` would be sufficient.
However, I also needed to execute inline scripts, which meant that I either had to use `unsafe-inline` (which is only marginally better than no CSP), a hash of the scripts' content, or a nonce.
I went with nonce, and even though it turned out to be pretty straightforward in the end, it still ended up eating most of my afternoon today.

## Setting up security headers

I used [`helmet`](https://helmetjs.github.io/), an `express` middleware that makes setting security headers easier.
The types make it convenient to see all the configuration options.

```bash
$ yarn add helmet
$ yarn add -D @types/helmet
```

## Setting up CSP with nonce

The idea is to generate a random nonce on every request, send it to the browser in the CSP header and make sure all scripts have a matching value: `<script nonce={nonce}>`.
See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) for all possible CSP options.

`'strict-dynamic'` tells the browser to trust any other code executed by already trusted code.
If you specify `'strict-dynamic'`, the browser will disregard other options such as `'self' *.3rdparty.com`.
Every script will then need to have the nonce.

```ts
import express from 'express'
import helmet from 'helmet'
import { v4 } from 'uuid'

const server = express()

const options = {
  directives: {
    'default-src': ["'self'"],
    'script-src': [(req, res) => `'nonce-${res.locals.nonce}' 'strict-dynamic'`],
  },
  // ... more config options
}

// generate a nonce on every request and save it
server.use((req, res, next) => {
  res.locals.nonce = v4()
  helmet.contentSecurityPolicy(options)(req, res, next)
})
```

We will need to pass the nonce to Next as well as any other scripts.
Let's create a custom `Document` in `pages/_document.tsx`, retrieve the nonce from context and pass it down:

```jsx
import Document, {
  Head,
  Html,
  Main,
  NextScript,
  DocumentContext,
} from 'next/document'
import { ServerResponse } from 'http'

type ResponseWithNonce = ServerResponse & { locals: { nonce?: string } }

type CustomDocumentProps = {
  nonce?: string
}

class CustomDocument extends Document<CustomDocumentProps> {
  static async getInitialProps(ctx: DocumentContext) {
    // get the nonce from res.locals.nonce
    const nonce = (ctx.res as ResponseWithNonce).locals.nonce
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps, nonce }
  }

  render() {
    return (
      <Html>
        {/* pass it to Next Head */}
        <Head nonce={this.props.nonce} />
        <body>
          <Main />
          {/* pass it to Next scripts */}
          <NextScript nonce={this.props.nonce} />

          {/* as well as any other scripts */}
          <script
            src="https://trustworthy-conglomerate.com/vacuum.js"
            nonce={this.props.nonce}
          />
        </body>
      </Html>
    )
  }
}

export default CustomDocument
```

## Easier option

If you don't need to execute inline scripts, you don't need this nonce stuff.
It will suffice to specify trusted origins: `script-src 'self' *.3rdparty.com;`.
