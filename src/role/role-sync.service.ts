import { BadGatewayException, Injectable } from '@nestjs/common';

@Injectable()
export class RoleSyncService {
  async syncRoleName(name: string) {
    const peerUrl = this.getEnv('ROLE_SYNC_PEER_URL');
    const secret = this.getEnv('ROLE_SYNC_SECRET');
    const tenantId = this.getEnv('ROLE_SYNC_TENANT_ID');

    if (!peerUrl || !secret) {
      return { enabled: false };
    }

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-role-sync-secret': secret,
      'x-role-sync-source': 'gestion-stock-backend-rochester',
    };

    if (tenantId) headers['x-tenant-id'] = tenantId;

    const res = await fetch(
      `${peerUrl.replace(/\/+$/, '')}/internal/roles/sync`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new BadGatewayException({
        message: 'Role sync failed',
        peerStatus: res.status,
        peerBody: body.slice(0, 500),
      });
    }

    return { enabled: true };
  }

  private getEnv(key: string): string | null {
    const value = process.env[key]?.trim();
    return value || null;
  }
}
