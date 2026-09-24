Yogi Growing Together — Fund Allocation Dashboard — Step 3
Run locally
Requirements: Node.js 18+.
```bash
npm install
```
Set environment variables before starting:
Windows PowerShell
```powershell
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="CHANGE_THIS_TO_A_STRONG_PASSWORD"
npm start
```
macOS/Linux
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD='CHANGE_THIS_TO_A_STRONG_PASSWORD' npm start
```
Open:
Public dashboard: http://localhost:3000/
Admin panel: http://localhost:3000/admin
Step 3 security
Admin password is NOT stored in the frontend.
Admin session uses an HttpOnly, Secure, SameSite cookie.
Dashboard editing API requires authentication.
Dashboard data is stored server-side in `data/dashboard.json`.
Input is validated/sanitized before saving.
For a real deployment, use HTTPS and a persistent disk/storage for `data/`.
For multiple server instances, move sessions/data to a shared database such as PostgreSQL/Redis.
Render deployment
Create a Web Service from this project:
Build Command: `npm install`
Start Command: `npm start`
Environment Variables:
`ADMIN_USERNAME` = your admin username
`ADMIN_PASSWORD` = a strong unique password
If using Render and you need changes to survive redeploys/restarts, attach a persistent disk and set:
`DATA_DIR=/var/data`
Then the dashboard data file is saved under `/var/data/dashboard.json`.
Important
The supplied default data is only the data from the design reference. Replace it through `/admin` after deployment.
