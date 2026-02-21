---
name: database-design-and-migration
description: Agile database development for rapid prototyping. Focuses on speed, 'code-first' changes, and seed data management rather than strict migration history or performance tuning.
---

# Agile Database Design & Migration

## Overview
This skill guides you through rapid database iteration typical in early-stage development.
- **Priority**: Development Speed > Data Preservation > Performance.
- **Method**: Code-first schema changes followed by forced synchronization.
- **Safety**: Minimal. Local data loss is acceptable if Seed scripts are maintained.

## Process

### 1. Schema Modification (Code First)
Update the database schema definition in the code or configuration file (e.g., `schema.prisma`, TypeORM entities, Django models).

**Focus on Logic, Not Performance:**
- ✅ Use correct data types (String, Int, Boolean, Enum).
- ✅ Define correct relationships (1:1, 1:N, M:N).
- ✅ Set critical constraints (`NOT NULL`, `UNIQUE`, `DEFAULT`).
- ❌ Do NOT spend time on custom indexes or partitioning unless explicitly asked.
- ❌ Do NOT split tables for "future scalability" (YAGNI).

### 2. Apply Changes (Force Sync)
Do not create complex migration version files. Use the tool's "push" or "sync" capability.

- **Prisma**: `npx prisma db push` (Changes schema directly, may reset data).
- **TypeORM**: `synchronize: true` in config.
- **Django**: `makemigrations` -> `migrate` (Standard flow is fine, but don't fear `migrate --fake` or dropping the DB if conflicts arise).

**Handling Conflicts:**
If a change requires a complex migration (e.g., changing a column type with existing data):
1.  **Just Drop It**: Drop the column or the entire table.
2.  **Reset**: It is faster to reset the database than to write a migration script for dev data.

### 3. Data Restoration (Seeding)
Since we treat the DB as ephemeral, the **Seed Script** is your lifeline.

- **Requirement**: Whenever you change the schema, **UPDATE the seed script** immediately if it breaks.
- **Action**: Run the seed command after every schema reset.
- **Content**: Ensure the seed script creates enough dummy data to test the UI/API (e.g., 2 users, 5 posts, etc.).

## Command reference (Examples)

**Prisma:**
```bash
# 1. Modify schema.prisma
# 2. Update DB (Accept data loss warning with --accept-data-loss if needed)
npx prisma db push
# 3. Refill data
npm run seed
```

**General SQL:**
```sql
-- If column change is blocked:
DROP TABLE users; -- Just kill it
-- Re-create table with new schema...
```

## Checklist before finishing
- [ ] Schema file matches the TS/Python models.
- [ ] Seed script runs without error.
- [ ] Basic CRUD operations work with the new schema.
