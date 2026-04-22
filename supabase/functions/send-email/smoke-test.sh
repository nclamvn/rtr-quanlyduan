#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Smoke test for send-email Edge Function
# Usage: ./smoke-test.sh your@email.com
#
# Prerequisites:
#   export SUPABASE_URL=https://<project-ref>.supabase.co
#   export SUPABASE_SERVICE_KEY=<service-role-key>
# ═══════════════════════════════════════════════════════════

set -e

TEST_EMAIL="${1:-admin@rtrobotics.com}"
SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL first}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY first}"
TIMESTAMP=$(date +%s)

echo "════════════════════════════════════════"
echo "  send-email Edge Function Smoke Test"
echo "════════════════════════════════════════"
echo "Target:  ${TEST_EMAIL}"
echo "URL:     ${SUPABASE_URL}/functions/v1/send-email"
echo ""

echo "→ Sending test payload..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${SUPABASE_URL}/functions/v1/send-email" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"record\": {
      \"id\": \"smoke-test-${TIMESTAMP}\",
      \"user_id\": null,
      \"type\": \"alert_dispatch\",
      \"title\": \"[Smoke Test] RtR Control Tower Email Pipeline\",
      \"title_vi\": \"[Smoke Test] Kiểm tra hệ thống email Control Tower\",
      \"body\": \"This is a smoke test. If you receive this, the email pipeline works. Sent at $(date).\",
      \"entity_type\": \"alert\",
      \"entity_id\": \"smoke-test-${TIMESTAMP}\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "← HTTP ${HTTP_CODE}"
echo "← Body: ${BODY}"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ Function responded OK"
  echo "  Check inbox: ${TEST_EMAIL}"
  echo "  Check Supabase Dashboard → Edge Functions → send-email → Logs"
elif [ "$HTTP_CODE" = "404" ]; then
  echo "✗ Function not found (404)"
  echo "  Deploy: supabase functions deploy send-email"
else
  echo "✗ Unexpected response: HTTP ${HTTP_CODE}"
  echo "  Check Supabase logs for details"
fi

echo ""
echo "Note: smoke test sends directly to Edge Function."
echo "In production, the pg_net trigger (migration 011) invokes"
echo "the function automatically on every notifications INSERT."
