# CSAudit Documentation

Documentation for the Cybersecurity Audit & Asset Management Portal.

---

## Project Structure

| Folder    | Purpose                                      |
|-----------|----------------------------------------------|
| `Frontend`| React.js UI (Tailwind CSS)                   |
| `Backend` | Node.js + Express API                        |
| `Docs`    | Project documentation                        |

## Running with PM2

From the project root:

```bash
# Start all services
pm2 start ecosystem.config.js

# View logs
pm2 logs

# View specific app logs
pm2 logs csaudit-backend
pm2 logs csaudit-frontend

# Status
pm2 status

# Stop all
pm2 stop all
```
