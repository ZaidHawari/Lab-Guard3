# Lab-Guard3

## Requirements

- **Database**
  - Engine: [PostgreSQL 18.4](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)

---

## Installation

### 1. Database Setup
Open a terminal and run the following command to restore the database:

```bash
psql -U postgres -d postgres -f database/database.sql
```

> ⚠️ Make sure PostgreSQL is installed and `psql` is added to your system PATH.

This will automatically create and populate the `labguard` database from the SQL dump.

After creating the database, You can copy and run the SQL queries from [data.txt](https://github.com/ZaidHawari/Lab-Guard3/blob/main/database/data.txt) to populate the database with sample data.

---

### 2. Install Dependencies

From the project root, run:

```bash
npm run install-all
```

---

### 3. Run the Project

From the project root, run:

```bash
npm run dev
```
