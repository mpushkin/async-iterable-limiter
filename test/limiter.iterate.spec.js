const { promisify } = require('util');
const Limiter = require('../index');

describe('limiter.iterate.spec.js', () => {

	async function * createIterable({ count, errorOnItemIndex }) {
		for (let i = 0; i < count; i++) {
			if (errorOnItemIndex === i) {
				throw new Error(`iterable error on item index ${i}`);
			}
			yield i;
		}
	}

	describe('sunshine scenario - iteration over an async iterable', () => {
		it('should work', async () => {
			const startDate = new Date();
			const processingLog = [];

			const iterable = createIterable({ count: 10 });
			await Limiter.iterate(iterable, 5, async (item) => {
				processingLog.push({ action: 'start processing item', item });
				await promisify(setTimeout)(200);
				processingLog.push({ action: 'finish processing item', item });
			});
			processingLog.push({ action: 'finish processing all items' });

			const duration = new Date() - startDate;
			expect(duration).to.be.lessThan(500); // 10 items / 5 in parallel * 200 ms task = 400 ms total

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'finish processing item', item: 2 },
				{ action: 'start processing item', item: 7 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'start processing item', item: 8 },
				{ action: 'finish processing item', item: 4 },
				{ action: 'start processing item', item: 9 },
				{ action: 'finish processing item', item: 5 },
				{ action: 'finish processing item', item: 6 },
				{ action: 'finish processing item', item: 7 },
				{ action: 'finish processing item', item: 8 },
				{ action: 'finish processing item', item: 9 },
				{ action: 'finish processing all items' },
			]);
		});
	});

	describe('iteration over an async iterable with concurrency 1', () => {
		it('should work', async () => {
			const startDate = new Date();
			const processingLog = [];

			const iterable = createIterable({ count: 4 });
			await Limiter.iterate(iterable, 1, async (item) => {
				processingLog.push({ action: 'start processing item', item });
				await promisify(setTimeout)(200);
				processingLog.push({ action: 'finish processing item', item });
			});
			processingLog.push({ action: 'finish processing all items' });

			const duration = new Date() - startDate;
			expect(duration).to.be.lessThan(900); // 4 items / 1 in parallel * 200 ms task = 800 ms total

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'finish processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'finish processing all items' },
			]);
		});
	});

	describe('iteration over an async iterable with concurrency Infinity', () => {
		it('should work', async () => {
			const startDate = new Date();
			const processingLog = [];

			const iterable = createIterable({ count: 10 });
			await Limiter.iterate(iterable, Infinity, async (item) => {
				processingLog.push({ action: 'start processing item', item });
				await promisify(setTimeout)(200);
				processingLog.push({ action: 'finish processing item', item });
			});
			processingLog.push({ action: 'finish processing all items' });

			const duration = new Date() - startDate;
			expect(duration).to.be.lessThan(300); // all items in parallel

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'start processing item', item: 5 },
				{ action: 'start processing item', item: 6 },
				{ action: 'start processing item', item: 7 },
				{ action: 'start processing item', item: 8 },
				{ action: 'start processing item', item: 9 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'finish processing item', item: 2 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'finish processing item', item: 4 },
				{ action: 'finish processing item', item: 5 },
				{ action: 'finish processing item', item: 6 },
				{ action: 'finish processing item', item: 7 },
				{ action: 'finish processing item', item: 8 },
				{ action: 'finish processing item', item: 9 },
				{ action: 'finish processing all items' },
			]);
		});
	});

	describe('iteration over an empty iterable', () => {
		it('should work', async () => {
			const iterable = createIterable({ count: 0 });
			await Limiter.iterate(iterable, 5, async (item) => {
				throw new Error('dont expect to be here');
			});
		});
	});

	describe('iteration over an array (non-async iterable)', () => {
		it('should work', async () => {
			const iterable = [1, 2, 3];
			const processed = [];
			await Limiter.iterate(iterable, 5, async (item) => {
				processed.push(item);
			});
			expect(processed).to.eql([1, 2, 3]);
		});
	});

	describe('iteration over an async iterable with error in iterable', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10, errorOnItemIndex: 7 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					await promisify(setTimeout)(200);
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errMessage: err.message });
			}

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'got error', errMessage: 'iterable error on item index 7' },
			]);
		});
	});

	describe('iteration over an async iterable with error at start of task handler on early task', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					if (item === 2) {
						throw new Error(`error on processing item ${item}`);
					}
					await promisify(setTimeout)(200);
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errName: err.name, errors: [...err].map(err => err.message) });
			}

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'finish processing item', item: 1 },
				{
					action: 'got error',
					errName: 'AggregateError',
					errors: [ 'error on processing item 2' ]
				},
			]);
		});
	});

	describe('iteration over an async iterable with error at end of task handler on early task', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					await promisify(setTimeout)(200);
					if (item === 2) {
						throw new Error(`error on processing item ${item}`);
					}
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errName: err.name, errors: [...err].map(err => err.message) });
			}

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'finish processing item', item: 4 },
				{ action: 'finish processing item', item: 5 },
				{ action: 'finish processing item', item: 6 },
				{
					action: 'got error',
					errName: 'AggregateError',
					errors: [ 'error on processing item 2' ]
				}
			]);
		});
	});

	describe('iteration over an async iterable with error at start of task handler on late task', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					if (item === 7) {
						throw new Error(`error on processing item ${item}`);
					}
					await promisify(setTimeout)(200);
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errName: err.name, errors: [...err].map(err => err.message) });
			}

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'finish processing item', item: 2 },
				{ action: 'start processing item', item: 7 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'finish processing item', item: 4 },
				{ action: 'finish processing item', item: 5 },
				{ action: 'finish processing item', item: 6 },
				{
					action: 'got error',
					errName: 'AggregateError',
					errors: [ 'error on processing item 7' ]
				},
			]);
		});
	});

	describe('iteration over an async iterable with error at end of task handler on late task', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					await promisify(setTimeout)(200);
					if (item === 9) {
						throw new Error(`error on processing item ${item}`);
					}
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errName: err.name, errors: [...err].map(err => err.message) });
			}

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'finish processing item', item: 2 },
				{ action: 'start processing item', item: 7 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'start processing item', item: 8 },
				{ action: 'finish processing item', item: 4 },
				{ action: 'start processing item', item: 9 },
				{ action: 'finish processing item', item: 5 },
				{ action: 'finish processing item', item: 6 },
				{ action: 'finish processing item', item: 7 },
				{ action: 'finish processing item', item: 8 },
				{
					action: 'got error',
					errName: 'AggregateError',
					errors: [ 'error on processing item 9' ]
				},
			]);
		});
	});

	describe('iteration over an async iterable with two errors in task handlers', () => {
		it('should throw expected error', async () => {
			const iterable = createIterable({ count: 10 });

			const processingLog = [];
			try {
				await Limiter.iterate(iterable, 5, async (item) => {
					processingLog.push({ action: 'start processing item', item });
					await promisify(setTimeout)(200);
					if (item === 2 || item === 4) {
						throw new Error(`error on processing item ${item}`);
					}
					processingLog.push({ action: 'finish processing item', item });
				});
				processingLog.push({ action: 'finish processing all items' });
			} catch (err) {
				processingLog.push({ action: 'got error', errName: err.name, errors: [...err].map(err => err.message) });
			}
			await promisify(setTimeout)(500); // waiting for potential unhandled promise rejection of second failed task

			expect(processingLog).to.eql([
				{ action: 'start processing item', item: 0 },
				{ action: 'start processing item', item: 1 },
				{ action: 'start processing item', item: 2 },
				{ action: 'start processing item', item: 3 },
				{ action: 'start processing item', item: 4 },
				{ action: 'finish processing item', item: 0 },
				{ action: 'start processing item', item: 5 },
				{ action: 'finish processing item', item: 1 },
				{ action: 'start processing item', item: 6 },
				{ action: 'finish processing item', item: 3 },
				{ action: 'finish processing item', item: 5 }, // waited until started tasks finished processing
				{ action: 'finish processing item', item: 6 },
				{ // then returned errors as aggregate error
					action: 'got error',
					errName: 'AggregateError',
					errors: [ 'error on processing item 2', 'error on processing item 4' ],
				}
			]);
		});
	});

	describe('iteration over an async iterable with error in task handler and in iterable itself', () => {
	});
});