import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureFlagsService {
  private flags: Map<string, boolean> = new Map([
    ['graphql_api', false],
    ['advanced_analytics', false],
    ['ai_scheduling', false],
    ['mobile_offline_sync', true],
    ['realtime_updates', false],
  ]);

  isEnabled(flagName: string, tenantId?: string): boolean {
    return this.flags.get(flagName) ?? false;
  }

  async setFlag(flagName: string, enabled: boolean): Promise<void> {
    this.flags.set(flagName, enabled);
  }
}
