# async-iterable-limiter
Iterate over [async iterable](https://javascript.info/async-iterators-generators) with concurrency limit.

Difference from many other similar modules is that it supports iterating over async iterables (like ReadableStream or database cursor).

Note: documentation and tests are work in progress, but it should already work :)

## Usage

Simple:
```js
const Limiter = require('async-iterable-limiter');

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

## TODO:
Functionality:
- [ ] add `stopOnError` parameter (true by default in current implementation)
- [ ] maybe add `Limiter.map` function that would produce an array with sequential results
- [ ] maybe add `Limiter.mapIterable` function that would produce another async iterable
- [ ] make `inProgress` and `concurrency` readonly properties, to prevent mess

Tests:
- [x] add test for error handling of async iterable
- [x] add test for error handling of task
- [ ] add test for invalid input of params
- [ ] add test for expected behavior of multiple calls of Limiter.ready/finished class

Documentation:
- [ ] readme
- [ ] api surface documentation
- [ ] typescript definitions