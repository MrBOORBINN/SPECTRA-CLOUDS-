# INFHOST Security Architecture

INFHOST enforces strict defensive engineering across all architectural layers:

1. **Isolation of Console Commands**:
   - The web frontend and API strictly enforce Minecraft in-game syntax parsing.
   - OS shell utilities (`bash`, `sh`, `rm`, `curl`, `wget`, `python`, `systemctl`) are blocked at the controller gateway.
2. **Server-Authoritative Balances**:
   - Authoritative credit ledger stored in PostgreSQL.
   - No client-side credit writes or bypasses.
3. **Mutual Node Authentication**:
   - Node Agents authenticate via cryptographically random 256-bit bearer tokens.
   - Unauthorized node telemetry is immediately rejected with HTTP 403.
4. **Heartbeat Staleness Detection**:
   - Nodes without heartbeats for >45s are marked `OFFLINE`.
   - Servers on offline nodes reflect `NODE OFFLINE` rather than faking active metrics.
5. **Path Traversal Protection**:
   - Server file operations are sandbox-jailed to the server's root volume.
   - Requests with `../` escaping root directory boundaries are rejected.
