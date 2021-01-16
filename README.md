Graceful shutdown application services

```js
init([
    mysqlPool,
    nextServer,
    httpServer,
]).catch(console.error);
```
