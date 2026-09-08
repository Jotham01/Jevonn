# Deploying FoodKart to Google Cloud (Multi-VM)

This follows the assignment's pattern: one service + its own database per VM,
services talk over **internal IPs**, and only the frontend is exposed publicly.

Your app has three parts, so we use **three VMs**:

| VM            | Runs                | Ports (internal) | Public? |
|---------------|---------------------|------------------|---------|
| `menu-vm`     | menu-service + DB   | 4001             | no      |
| `order-vm`    | order-service + DB  | 4002             | no      |
| `frontend-vm` | web (nginx)         | 80               | yes     |

> The browser (on the user's machine) calls menu-service and order-service
> **directly**, so those two VMs also need their ports reachable from the
> internet for the SPA to work. If you want them fully private, you'd add an
> API gateway / reverse proxy on the frontend VM — see "Fully private variant"
> at the end. The steps below expose 4001/4002 publicly, which is the simplest
> setup and matches how the app is wired today.

---

## 0. Prerequisites

- A GCP project with billing enabled.
- `gcloud` CLI installed and authenticated locally (`gcloud init`), OR use the
  Cloud Console web UI + SSH button.
- Your code pushed to a Git repo the VMs can clone (GitHub/GitLab).

Set some shell variables (adjust to taste):

```bash
export PROJECT_ID=$(gcloud config get-value project)
export ZONE=us-central1-a
export REGION=us-central1
export REPO_URL=https://github.com/<you>/<your-repo>.git   # your repo
```

---

## 1. Create the three VMs

All on the **default VPC** so they share an internal network. Small machines are fine.

```bash
for NAME in menu-vm order-vm frontend-vm; do
  gcloud compute instances create $NAME \
    --zone=$ZONE \
    --machine-type=e2-small \
    --image-family=debian-12 \
    --image-project=debian-cloud \
    --tags=$NAME
done
```

List them and note the **internal** and **external** IPs:

```bash
gcloud compute instances list
```

You'll refer to these below:

- `MENU_INTERNAL_IP`   (internal IP of menu-vm)
- `MENU_EXTERNAL_IP`   (external IP of menu-vm)
- `ORDER_EXTERNAL_IP`  (external IP of order-vm)
- `FRONTEND_EXTERNAL_IP` (external IP of frontend-vm)

---

## 2. Firewall rules

The default VPC already allows internal traffic between VMs. We just need to
open the service/web ports from the internet.

```bash
# Web app (frontend) on port 80
gcloud compute firewall-rules create allow-frontend-external \
  --network=default --direction=INGRESS --action=ALLOW \
  --rules=tcp:80 --target-tags=frontend-vm

# menu-service on 4001 and order-service on 4002 (called by the browser)
gcloud compute firewall-rules create allow-menu-external \
  --network=default --direction=INGRESS --action=ALLOW \
  --rules=tcp:4001 --target-tags=menu-vm

gcloud compute firewall-rules create allow-order-external \
  --network=default --direction=INGRESS --action=ALLOW \
  --rules=tcp:4002 --target-tags=order-vm
```

---

## 3. Install Docker on each VM

SSH into each VM (`gcloud compute ssh <vm> --zone=$ZONE`) and run the same
install steps. Do this on **all three** VMs.

```bash
# --- run on every VM ---
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# let your user run docker without sudo (log out/in after)
sudo usermod -aG docker $USER
```

Log out and back in so the docker group takes effect, then verify:

```bash
docker version
```

---

## 4. Clone the repo on each VM

On **every** VM (the assignment clones the full repo everywhere, then each VM
only runs its own scoped compose file):

```bash
git clone $REPO_URL foodkart
cd foodkart
```

---

## 5. Bring up each service with its scoped compose file

Each part has its own `docker-compose.yml` that runs only that service + its DB.

### menu-vm

```bash
cd ~/foodkart/services/menu-service
docker compose up -d --build
docker compose ps
```

### order-vm

Point it at menu-vm's **internal** IP so the service-to-service call stays on
the private network:

```bash
cd ~/foodkart/services/order-service
MENU_SERVICE_URL=http://<MENU_INTERNAL_IP>:4001 docker compose up -d --build
docker compose ps
```

### frontend-vm

The browser talks to the services directly, so use their **external** IPs here:

```bash
cd ~/foodkart/web
MENU_URL=http://<MENU_EXTERNAL_IP>:4001 \
ORDER_URL=http://<ORDER_EXTERNAL_IP>:4002 \
docker compose up -d --build
docker compose ps
```

---

## 6. Verify

### Internal IP communication (from order-vm, over the private network)

```bash
# menu-service health via internal IP
curl -v http://<MENU_INTERNAL_IP>:4001/health
# expect: {"status":"ok","service":"menu-service"}
```

### Seed the menu (menu-vm)

The menu-service auto-seeds on first boot (`SEED_ON_START=true`). Confirm the
catalog is populated:

```bash
curl -s http://localhost:4001/api/menu | head
```

If you ever need to reseed manually:

```bash
docker compose exec menu-service node src/seed.js
```

### End to end (from your laptop's browser)

Open:

```
http://<FRONTEND_EXTERNAL_IP>/
```

- Browse the menu, add items, place an order → you get a bill.
- Switch to the **Invoices** tab → your order shows up as an invoice.

---

## 7. Common gotchas

- **Invoices tab is empty on a fresh deploy** — expected. Each VM's database
  starts empty (its own Docker volume). Place an order through the app and it
  will appear. Invoices are stored per-deployment, not shared with your local runs.
- **Menu loads but ordering fails** — check `ORDER_URL` on the frontend points
  at order-vm's external IP, and that the `allow-order-external` firewall rule
  and port 4002 are open.
- **order-service can't reach menu** — `MENU_SERVICE_URL` on order-vm must be
  menu-vm's **internal** IP, and both VMs must be on the default VPC.
- **Mixed content** — if you put the frontend behind HTTPS later, the service
  URLs must also be HTTPS, or browsers will block the calls.

---

## Fully private variant (optional, closer to a real deployment)

Keep 4001/4002 private (no `allow-menu-external` / `allow-order-external`) and
have the browser call everything through the frontend VM:

- Add an nginx reverse proxy on frontend-vm that proxies `/api/menu` →
  `MENU_INTERNAL_IP:4001` and `/api/orders` → `ORDER_INTERNAL_IP:4002`.
- Set the web app's `MENU_URL`/`ORDER_URL` to the frontend's own origin
  (e.g. `http://<FRONTEND_EXTERNAL_IP>`), so all traffic enters through one
  public door and fans out over internal IPs.

This matches the assignment's api-gateway idea, where only the frontend is
publicly exposed and everything else talks over internal IPs.
```
