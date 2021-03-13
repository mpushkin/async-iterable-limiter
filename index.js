class Limiter {
	constructor({ concurrency }) {
		this.concurrency = concurrency;
		this.inProgress = 0;
		this.waiters = [];
	}

	add(promise) {
		this.inProgress++;
		promise
			.then(() => {
				this.inProgress--;
				this.waiters.forEach(({ resolve, lessThan }, i) => {
					if (this.inProgress < lessThan) {
						resolve();
						this.waiters[i] = null;
					}
				}, this);
				this.waiters = this.waiters.filter(Boolean);
			})
			.catch(err => {
				this.inProgress--;
				this.waiters.forEach(({ reject }) => {
					reject(err);
				});
				this.waiters = [];
			});
	}

	waitInProgressLessThan(lessThan) {
		if (this.inProgress < lessThan) {
			return;
		}
		return new Promise((resolve, reject) => {
			const waiter = { resolve, reject, lessThan };
			this.waiters.push(waiter);
		});
	}

	async ready() {
		return this.waitInProgressLessThan(this.concurrency);
	}

	async finished() {
		return this.waitInProgressLessThan(1);
	}

	static async iterate(iterable, concurrency, iteratee) {
		const limiter = new Limiter({ concurrency });
		for await (const item of iterable) {
			await limiter.ready();
			limiter.add(iteratee(item));
		}
		await limiter.finished();
	}
}

module.exports = Limiter;