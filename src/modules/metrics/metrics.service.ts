import { Injectable } from '@nestjs/common';
import CircularBuffer from 'circularbuffer';
import pidusage from 'pidusage';
import { PrismaService } from '../../providers/prisma/prisma.service';
import type { ProcessMetricData } from './metrics.interface';

@Injectable()
export class MetricsService {
  private queue = new CircularBuffer<ProcessMetricData>(60);

  constructor(private prisma: PrismaService) {}

  async updateProcessMetrics(): Promise<ProcessMetricData[]> {
    const stats = await pidusage(process.pid);
    this.queue.enq({
      date: new Date(),
      cpu: Math.round(stats.cpu * 100) / 100,
      memory: Math.round(stats.memory * 100) / 100,
    });
    return this.getProcessMetrics();
  }

  async getProcessMetrics(): Promise<ProcessMetricData[]> {
    return this.queue.toArray();
  }
}
