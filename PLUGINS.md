## Plugin architecture

React Playground plugins are modelled based on Plugin Architecture of `apollo-server` package

Plugins are javascript objects with keys as names of events and values as functions that
can return a `Promise` or `void`

- `init`
- `preRequest`

Note: Both of the keys are optional

Ex:

```js
    const plugin = {
        init: function() {
            console.log('init called');
        },

        preRequest: async() => {
            console.log('preRequest called');
        }
    }
```

Plugins can be passed in the following ways

- Using the `renderPlayground` function from `@apollographql/graphql-playground-html` to serve the playground's HTML. This allows specifying the file path to JS or TS module which will be bundled and run on the client's browser. The module must export an object with a `preRequest` function and/or an `init` function.

    ```ts
    // Plugin.ts
    export default {
      init: () => console.log('Init'),
      preRequest: () => console.log('Pre Request'),
    }
    ```

    ```ts
    // Server.ts
    import { ApolloServer } from 'apollo-server-express';
    import express, { Request, Response } from 'express';
    import * as graphqlPlayground from '@apollographql/graphql-playground-html';

    const server = new ApolloServer({ /** Apollo Init Options */ });
    const app = express();

    let playground;
    app.get('/graphql', (req: Request, res: Response) => {
      if (!playground) {
        playground = graphqlPlayground.renderPlaygroundPage({
          /** Other playground options */
          plugins: [
            {
              filePath: path.resolve('./Plugin.ts'),
              buildOptions: { /** es-build options  */ }
            },
            {
              init: () => console.log('Init1'),
              preRequest: () => console.log('PreRequest1')
            }
          ],
        });
      }
      res.setHeader('Content-Type', 'text/html');
      res.write(playground);
      res.end();
      return res;
    });

    await server.start();
    server.applyMiddleware({ app });
    app.listen({ port: 8080 }
    ```

    This method allows using external npm dependencies, so long as the dependencies are compatible with the browser runtime.
    
    `@apollographql/graphql-playground-html` uses `es-build` to bundle the plugin files. The `buildOptions` property is used to pass any build config on to `es-build`. It accepts all properties that es-build accepts, with the exception of the `format` property, which must be set to `esm`.

    The plugin may also be an inline object. In this case, the values are stringified and sent to the browser for rendering/evaluating as part of the HTML.

- If you're using `graphql-playground-html` or `graphql-playground-react` directly, then pass the `plugins`
  key in the `options` object in the call to *GraphQLPlayground.init()* as shown below.
  ```js
      GraphQLPlayground.init(root, {
        "env": "react",
        "canSaveConfig": false,
        "headers": {
          "test": "test",
        },
        "plugins": [{
          init: async () => {
            await new Promise(resolve => {
              setTimeout(resolve, 10000)
            })
          },
          preRequest: async (request, linkProps) => {
            console.log(`request ${JSON.stringify(request)}`)
            if (linkProps) {
              linkProps.headers['Apollo-Query-Plan-Experimental'] = 10
            }
            await new Promise(resolve => {
              setTimeout(resolve, 500)
            })
          }
        }]
      })
  ```
  Note: `GraphQLPlayground` is exposed in `window` object when you include this package

`init` function is called for all registered plugins after app initialization is complete

`preRequest` function is called for all plugins before each GraphQL request is sent to the backend server
   - It takes two arguments `request` and `linkProperties`
   - `request` corresponds to the following type
     ```ts
        export interface GraphQLRequestData {
          query: string
          variables?: any
          operationName?: string
          extensions?: any
        }
     ```
     The query and other params will be sent to the GraphQL server
   - `linkProperties` contains the following type exported in `fetchingSagas.ts`
     ```ts
        export interface LinkCreatorProps {
          endpoint: string
          headers?: Headers
          credentials?: string
        }
     ```
     The headers will be sent in the GraphQL request and can be modified in any of the plugins
     
