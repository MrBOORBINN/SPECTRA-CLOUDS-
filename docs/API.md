# INFHOST API Reference

## Authentication
All protected routes require an HTTP Bearer header or session cookie:
`Authorization: Bearer <sessionToken>`

### Auth Endpoints
- `POST /api/auth/register` — Body: `{ email, username, password }`
- `POST /api/auth/login` — Body: `{ email, password }`
- `POST /api/auth/logout` — Revokes active session token
- `GET /api/user` — Returns current authenticated user and credit balance

### Server Management
- `GET /api/servers` — Returns servers belonging to user (or all servers for admin)
- `POST /api/servers` — Creates new server definition with port and resource reservation
- `GET /api/servers/:id` — Server details, allocation, and DNS configuration status
- `DELETE /api/servers/:id` — Terminates process, cleans files, releases allocated port
- `POST /api/servers/:id/start` — Starts Minecraft container process
- `POST /api/servers/:id/stop` — Sends graceful shutdown (`stop`)
- `POST /api/servers/:id/restart` — Restarts container process
- `POST /api/servers/:id/kill` — Sends SIGKILL signal to process
- `GET /api/servers/:id/console` — Retrieves container console buffer
- `POST /api/servers/:id/command` — Dispatches verified in-game Minecraft command (OS shell blocked)

### File Manager
- `GET /api/servers/:id/files?path=` — Lists directory tree
- `GET /api/servers/:id/files/content?path=` — Reads raw file contents (e.g. server.properties)
- `POST /api/servers/:id/files/content` — Writes file contents
- `POST /api/servers/:id/files/create` — Creates new file or folder
- `DELETE /api/servers/:id/files?path=` — Deletes target file or folder

### Backups
- `GET /api/servers/:id/backups` — Lists server snapshots
- `POST /api/servers/:id/backups` — Schedules asynchronous backup
- `POST /api/servers/:id/backups/:bId/restore` — Restores world & config from snapshot
- `DELETE /api/servers/:id/backups/:bId` — Deletes backup snapshot

### Credits & Billing
- `POST /api/credits/redeem` — Redeems voucher code (`INFHOST-XXXX-XXXX-XXXX`)
- `GET /api/billing/plans` — Returns hosting tier specifications and pricing
- `GET /api/billing/orders` — User order history
- `POST /api/billing/orders` — Creates order checkout session

### Node Agent Interface (`/node/*`)
- `POST /node/heartbeat` — Node health telemetry with CPU, RAM, disk, active servers
- `GET /node/servers/:id/status` — Status polling
- `GET /node/servers/:id/resources` — Live telemetry
- `POST /node/servers/:id/command` — Command bridge
