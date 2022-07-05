---
title: Getting rid of Redux / apollo-link-rest with Next.js
tags:
  - frontend
---
**TL;DR** I ditched Redux in favor of Apollo. This is how I set up `apollo-link-rest`.

Having worked with a Next.js setup with Apollo, Redux and a ton of other libraries recently, I grew somewhat impatient with the seconds-long hot-reload build times, minutes-long production builds and a 500 MB+ Docker context.
So, while setting up a frontend stack for a work project recently, my #1 aim was to make it as light-weight as possible.
This led me to reconsider every dependency in my setup.

Now Redux is not a great example of a bloated library, with its 348 KB including all dependencies.
But it does add complexity when mixed together with Apollo and SSR.
I reviewed what I actually used Redux for in my last project and decided to cut it.

## Redux use cases

I found that I had these two use-cases for Redux:

- managing global state
- separating async logic into thunks

For global state, Apollo was an obvious choice.
Apollo supports client-side state management out of the box since Apollo Client 2.5.
At first I found using queries and mutations to manage state somewhat cumbersome, but it's not too too bad and there are bright sides as well: no actions, resolvers instead of reducers, being able to query local state in the same query as remote data.
And from my (brief) experience, there is only so much global state to manage anyways.
Authentication, global notifications, and… that’s it?
Most of the time I try to keep state in components.

As for async logic - most of my thunks did not need access to Redux store anyway and could therefore be replaced with async event handlers.
A custom hook will take care of the rest.

## Handling REST requests

I decided to give `apollo-link-rest` a try, since I had Apollo already set up.
`Apollo-link-rest` allows you to write GraphQL queries against REST endpoints.
Because it’s an Apollo link, there is no need for separate error and authorization handling in addition to your GraphQL queries — `apollo-link-error` and `apollo-link-context` work for both GraphQL and `apollo-link-rest` requests.

## Setting up `apollo-link-rest`

The setup is as simple as creating a `RestLink` and adding it to you Apollo client.
I’m using Next.js `^9.3.1` with `@apollo/client ^3.0.0-beta`.
This is my `createApolloClient` function based on the [with-apollo](https://github.com/zeit/next.js/tree/canary/examples/with-apollo) example by Next:

```ts
import { RestLink } from 'apollo-link-rest'

// …

const restLink = new RestLink({
  uri: process.env.REST_URL,
})

// …

return new ApolloClient({
  ssrMode: Boolean(ctx),
  link: ApolloLink.from([authLink, errorLink, restLink, graphqlLink]),
  cache,
  typeDefs,
  resolvers: {},
})
```

This is the example Next.js + Apollo setup with an extra `authLink` and `errorLink`, and `typeDefs` and `resolvers` for local state management.

Beware of ordering of the links — `HttpLink` eats everything thrown at it and therefore needs to be last in the list.
We want to have `AuthLink` and `ErrorLink` applied to the other two, so they go first.

Aaaand it just works! Great.

![Screenshot of ReferenceError: Headers is not defined](/assets/images/headers.png)

Turns out SSR can reliably break just about anything at all.
`Apollo-link-rest` is apparently [not intended](https://github.com/apollographql/apollo-link-rest/issues/182#issuecomment-453181542) for SSR use and relies on the browser [Headers API](https://developer.mozilla.org/en-US/docs/Web/API/Headers) which is missing in our Node.js environment.
Let’s use `Header` from `node-fetch` as a polyfill: `yarn add node-fetch`

```ts
// polyfill Headers API server-side for apollo-link-rest
// https://github.com/apollographql/apollo-link-rest/issues/182#issuecomment-453209304
if ((global as any).Headers === null) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fetch = require('node-fetch')
  ;(global as any).Headers = fetch.Headers
}
```

And there we have it 🥳 We can now do this:

```gql
query TestRestQuery {
  healthcheck @rest(type: "Healthcheck", path: "/healthcheck") {
    status
  }
}
```
