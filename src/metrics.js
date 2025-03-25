const config = require("./config.js");
const os = require("os");

class PizzaMetrics {
	http = {
		get: 0,
		put: 0,
		post: 0,
		delete: 0,
	};

	auth = {
		success: 0,
		failure: 0,
		users: 0,
	};

	latency = {
		get: 0,
		put: 0,
		post: 0,
		delete: 0,
		factory: 0,
	};

	purchase = {
		revenue: 0,
		pizzas: 0,
	};

	track(req, res, next) {
		const start = Date.now();
		let method;
		switch(req.method) {
			case("GET"): {
				method = "get";
				this.http.get++;
				break;
			}
			case("PUT"): {
				method = "put";
				this.http.put++;
				break;
			}
			case("POST"): {
				method = "post";
				this.http.post++;
				break;
			}
			case("DELETE"): {
				method = "delete";
				this.http.delete++;
				break;
			}
			default: {
				console.log("unknown request method");
			}
		}
		
		res.on("finish", () => {
			const end = Date.now();
			this.latency[method] += end - start;
		});

		next();
	}

	
	buildMetricsObject() {
		return {
			resourceMetrics: [
				{
					scopeMetrics: [
						{
							metrics: [],
						},
					],
				},
			],
		};
	}

	buildIndividualMetric(metricName, metricValue, metricUnit, metricType, valueType, attributes) {
		attributes = { ...attributes, source: config.metrics.source };
		const metric = {
			name: metricName,
			unit: metricUnit,
			[metricType]: {
				dataPoints: [
					{
						[valueType]: metricValue,
						timeUnixNano: Date.now() * 1000000,
						attributes: [],
					},
				],
			},
		}

		Object.keys(attributes).forEach((key) => {
			metric[metricType].dataPoints[0].attributes.push({
				key: key,
				value: { stringValue: attributes[key] },
			});
		});
	
		if (metricType === 'sum') {
			metric[metricType].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
			metric[metricType].isMonotonic = true;
		}

		return metric;
	}

	getCpuUsagePercentage() {
		const cpuUsage = os.loadavg()[0] / os.cpus().length;
		return cpuUsage.toFixed(2) * 100;
	}

	getMemoryUsagePercentage() {
		const totalMemory = os.totalmem();
		const freeMemory = os.freemem();
		const usedMemory = totalMemory - freeMemory;
		const memoryUsage = (usedMemory / totalMemory);
		return memoryUsage.toFixed(2) * 100;
	}

	addHttpMetrics(metrics) {
		const methods = ["get", "put", "post", "delete"];
		methods.forEach((method) => {
			const count = this.buildIndividualMetric(method, this.http[method], "1", "sum", "asInt", {});
			metrics.resourceMetrics[0].scopeMetrics[0].metrics.push(count);
			const lat = this.buildIndividualMetric(`${method}_latency`, this.latency[method], "ms", "sum", "asInt", {});
			metrics.resourceMetrics[0].scopeMetrics[0].metrics.push(lat);
		});
	}

	addSystemMetrics(metrics) {
		const cpuMetric = this.buildIndividualMetric("cpu", this.getCpuUsagePercentage(), "%", "gauge", "asFloat", {});
		metrics.resourceMetrics[0].scopeMetrics[0].metrics.push(cpuMetric);
		const memMetric = this.buildIndividualMetric("memory", this.getMemoryUsagePercentage(), "%", "gauge", "asFloat", {});
		metrics.resourceMetrics[0].scopeMetrics[0].metrics.push(memMetric);
	}

	addAuthMetrics() {

	}

	addPurchaseMetrics() {

	}

	addLatencyMetrics() {

	}

	// send metrics to Grafana
	sendMetricsPeriodically(period) {
		setInterval(() => {
			try {
				let metricObject = this.buildMetricsObject();
				this.addHttpMetrics(metricObject);
				this.addSystemMetrics(metricObject);

				this.sendMetricsToGrafana(metricObject);
			} catch (error) {
				console.log("Error sending metrics", error);
			}
		}, period);
	}

	sendMetricsToGrafana(metricObject) {
		console.log(this.http);
		console.log(this.latency);
		console.log(JSON.stringify(metricObject));
		fetch(`${config.metrics.url}`, {
			method: 'POST',
			body: JSON.stringify(metricObject),
			headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
		})
		.then((response) => {
			if (!response.ok) {
				response.text().then((data) => {
					console.error('Failed to push metrics data to Grafana ' + data);
				});
			} else {
				console.log(`Pushed metrics`);
			}
		})
		.catch((error) => {
			console.error('Error pushing metrics:', error);
		});
	}
}

const metrics = new PizzaMetrics();
metrics.sendMetricsPeriodically(10000);

// Express middleware
const metricTracker = (req, res, next) => {
	metrics.track(req, res, next);
}

module.exports = { metricTracker };
