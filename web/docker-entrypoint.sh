set -e

MENU_URL="${MENU_URL:-http://localhost:4001}"
ORDER_URL="${ORDER_URL:-http://localhost:4002}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = {
    MENU_URL: "${MENU_URL}",
    ORDER_URL: "${ORDER_URL}"
};
EOF

echo "foodkart web config: MENU_URL=${MENU_URL} ORDER_URL=${ORDER_URL}"