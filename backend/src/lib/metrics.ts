import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import env from "./env";

type MetricCallback = () => Promise<number>;

export class MetricsService {
  private accums: Record<string, number>;
  private callbacks: Record<string, MetricCallback>;
  private timeout?: NodeJS.Timeout;
  private influxDB?: InfluxDB;
  private writeApi?: WriteApi;

  constructor() {
    this.accums = {};
    this.callbacks = {};
    const url = env.INFLUXDB_URL;
    const token = env.INFLUXDB_TOKEN;
    const org = env.INFLUXDB_ORG;
    const bucket = env.INFLUXDB_BUCKET;
    if (url && token && org && bucket) {
      this.influxDB = new InfluxDB({ url, token });
      this.writeApi = this.influxDB.getWriteApi(org, bucket);
    } else {
      console.error("Metrics are not collected because InfluxDB is not configured.");
    }
  }

  addInstantMetric(metric: string, field: string, callback: MetricCallback) {
    const key = `${metric}.${field}`;
    this.callbacks[key] = callback;
  }

  accumulateMetric(metric: string, field: string, value: number) {
    if (!this.writeApi) return;
    const key = `${metric}.${field}`;
    if (key in this.accums) {
      this.accums[key] += value;
    } else {
      this.accums[key] = value;
    }
  }

  start() {
    if (!this.writeApi) return;
    this.timeout = setInterval(this.intervalCallback, 60 * 1000);
  }

  stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
  }

  async destroy() {
    this.stop();
    if (this.writeApi) {
      await this.writeApi.close();
    }
  }

  private intervalCallback = () => {
    this.writeMetrics()
      .then(() => console.log("Wrote metrics successfully."))
      .catch((err) => console.error("Failed to write metrics:", err))
      .finally(() => this.resetMetrics());
  };

  private async writeMetrics() {
    if (!this.writeApi) return;
    for (const [key, value] of Object.entries(this.accums)) {
      const [metric, field] = key.split(".");
      const point = new Point(metric).intField(field, value);
      this.writeApi.writePoint(point);
    }
    for (const [key, callback] of Object.entries(this.callbacks)) {
      const [metric, field] = key.split(".");
      const value = await callback();
      const point = new Point(metric).intField(field, value);
      this.writeApi.writePoint(point);
    }
    await this.writeApi.flush();
  }

  private resetMetrics() {
    for (const key in this.accums) {
      this.accums[key] = 0;
    }
  }
}
