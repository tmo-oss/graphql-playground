## Plugin architecture

React Playground plugins are modelled based on Plugin Architecture of `apollo-server` package

Plugins are javascript objects with keys as names of events and values as functions that
can return a `Promise` or `void`
- init
- preRequest

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
- As part of apollo server's `playground` configuration
    ```js
      const server = new ApolloServer({
        typeDefs,
        resolvers,
        playground: {
          plugins: [
            {
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
            }
          ]
        }
      });
    ```
    We can see that the above code passes an array of plugin objects with
    hooks for init and preRequest events
- If you're using the `graphql-playground-html` or `graphql-playground-react` directly, then pass the `plugins`
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
     
