const { promisify } = require('util');
const Limiter = require('../index');

describe('limiter.spec.js', () => {

	async function * createIterable(count) {
		for (let i = 0; i < count; i++) {
			yield i;
		}
	}

	describe('simple iteration over a stream', () => {
		it('should work', async () => {
			const startDate = new Date();

			const iterable = createIterable(20);
			await Limiter.iterate(iterable, 5, async (item) => {
				console.log(new Date(), 'Start processing item', item);
				await promisify(setTimeout)(1000);
				console.log(new Date(), 'Finish processing item', item);
			});
			console.log(new Date(), 'Finish processing all items');

			const duration = new Date() - startDate;
			console.log('Took', duration);
			expect(duration).to.be.lessThan(4500); // 20 items / 5 in parallel = 4 seconds total
		});
	});

});