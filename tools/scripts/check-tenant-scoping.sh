#!/bin/bash
# Audit backend service files for missing organizationId scoping
# Flags Prisma queries that lack a 'where: { organizationId }' filter
# Usage: ./tools/scripts/check-tenant-scoping.sh

echo "=== NoVaFSM Tenant Scoping Audit ==="
echo ""

SERVICES_DIR="backend/src"
ISSUES=0

for file in $(find "$SERVICES_DIR" -name "*.service.ts"); do
  # Look for findMany/findFirst/count/update/delete without organizationId
  if grep -qE "prisma\.\w+\.(findMany|findFirst|count|updateMany|deleteMany)" "$file"; then
    # Check if corresponding queries have organizationId
    QUERIES=$(grep -nE "prisma\.\w+\.(findMany|findFirst|count|updateMany|deleteMany)" "$file")
    while IFS= read -r line; do
      LINE_NUM=$(echo "$line" | cut -d: -f1)
      # Check context around the query for organizationId
      CONTEXT=$(sed -n "$((LINE_NUM)),$((LINE_NUM+5))p" "$file")
      if ! echo "$CONTEXT" | grep -q "organizationId"; then
        echo "WARNING: $file:$LINE_NUM — possible missing organizationId scope"
        echo "  $line"
        ISSUES=$((ISSUES + 1))
      fi
    done <<< "$QUERIES"
  fi
done

echo ""
if [ "$ISSUES" -eq 0 ]; then
  echo "No obvious tenant scoping issues found."
else
  echo "Found $ISSUES potential tenant scoping issues. Review manually."
fi
