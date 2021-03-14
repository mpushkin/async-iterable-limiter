const AggregateError = require('aggregate-error');

class Limiter {
	constructor({ concurrency, stopOnError = true }) {
		this.concurrency = concurrency;
		this.stopOnError = stopOnError; // todo: implement

		this.inProgress = 0;
		this.waiters = [];
		this.errors = [];
	}

	add(promise) {
		this.inProgress++;
		promise
			.then(() => {
				this.inProgress--;
				this.resolveWaiters();
			})
			.catch(err => {
				this.inProgress--;
				this.errors.push(err);
				this.resolveWaiters();
			});
	}

	resolveWaiters() {
		if (this.hasErrors) {
			if (this.inProgress > 0) {
				// wait until all inProgress jobs are finished before resolving with errors, to get consistent behavior
				return;
			}
			this.waiters.forEach(({ reject }) => {
				reject(new AggregateError(this.errors));
			}, this); // todo: do we need to pas context ? or arrow func is enough ?
			this.waiters = [];
		} else {
			this.waiters.forEach(({ resolve, lessThan }, i) => {
				if (this.inProgress < lessThan) {
					resolve();
					this.waiters[i] = null;
				}
			}, this);
			this.waiters = this.waiters.filter(Boolean);
		}
	}

	get hasErrors() {
		return this.errors.length;
	}

	waitInProgressLessThan(lessThan) {
		if (this.hasErrors) {
			// if we already have errors, we want to wait until all tasks are finished
			lessThan = 1;
		}
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
		for await (const item of iterable) { // should we try/catch iterable error and add to this.errors here ? probably yes, but be careful
			await limiter.ready();
			limiter.add(iteratee(item));
		}
		await limiter.finished();
	}
}

module.exports = Limiter;