# Backup and Restore

Production data lives in two places:

- PostgreSQL: application data, settings, users, orders, offerings, media metadata.
- Uploads volume: actual uploaded files served from `/uploads`.

The production compose file mounts uploads at `/app/public/uploads` using the `uploads-data` volume. Back up both PostgreSQL and uploads together.

## Create Backup

```bash
./scripts/backup.sh
```

The script creates:

```text
backups/<project>-<timestamp>.tar.gz
backups/<project>-<timestamp>.tar.gz.sha256
```

Each package contains:

```text
manifest.json
database.dump
uploads.tar.gz
```

Admin backup library stores packages in:

```text
/admin/config/backups
web/data/backups in local development
/app/data/backups in production container
```

From admin you can create a backup, upload an old `.tar.gz` package, download it again, delete it, or choose a package to restore.

The production Docker image includes `pg_dump` and `pg_restore`, and `docker/compose.prod.yml` mounts `backups-data` at `/app/data/backups` so the admin backup library survives container rebuilds.

## Restore Backup

```bash
./scripts/restore.sh backups/<project>-<timestamp>.tar.gz
```

For non-interactive restore:

```bash
YES=1 ./scripts/restore.sh backups/<project>-<timestamp>.tar.gz
```

For a package managed by admin:

```bash
YES=1 ./scripts/restore.sh web/data/backups/<project>-<timestamp>.tar.gz
```

Restore stops the web service, restores PostgreSQL with `pg_restore`, replaces `/app/public/uploads`, then starts web again.

## Off-site Storage

Do not keep the only backup on the production server. Copy backup packages to S3, Cloudflare R2, Backblaze B2, a NAS, or another server.

Recommended retention:

- 7 daily backups
- 4 weekly backups
- 6 monthly backups

Test restore on a clean environment before relying on backups.
