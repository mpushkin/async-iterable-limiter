# async-iterable-limiter
Iterate over async iterable with concurrency limit.

Difference from many other similar modules is that it supports iterating over async iterables (like ReadableStream or database cursor).

Note: documentation and tests are work in progress, but it should already work :)

## Usage

Simple:
```js
const { iterate } = require('async-iterable-limiter');

const cursor = db.collection().find(); // todo: better example

await Limiter.iterate(cursor, 5, async (item) => {
	await doWork(item);
});
```

Complex (internal implementation of `iterate` function):
```js
const Limiter = require('async-iterable-limiter');

const limiter = new Limiter({ concurrency: 5 });
for await (const item of iterable) {
	await limiter.ready();
	limiter.add(taskReturningPromise(item));
}
await limiter.finished();
```