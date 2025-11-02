#!/bin/bash
# Automated test script for V2Ray Netlify Proxy
# Usage: ./test-proxy.sh <your-netlify-domain>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain provided
if [ -z "$1" ]; then
    echo "Usage: $0 <netlify-domain>"
    echo "Example: $0 my-app.netlify.app"
    exit 1
fi

DOMAIN=$1
BASE_URL="https://${DOMAIN}"
ENDPOINT="/xhttp"
PASSED=0
FAILED=0

echo "======================================"
echo "Testing V2Ray Netlify Proxy"
echo "Domain: $DOMAIN"
echo "======================================"
echo ""

# Test 1: Landing page
echo -n "Test 1 - Landing page accessibility: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Test 2: Proxy endpoint
echo -n "Test 2 - Proxy endpoint exists: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Test 3: POST request
echo -n "Test 3 - POST request support: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -d "test=data" "$BASE_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Test 4: Custom headers
echo -n "Test 4 - Custom header forwarding: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "User-Agent: V2Ray-Test" "$BASE_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Test 5: SSL certificate
echo -n "Test 5 - SSL certificate validity: "
if curl -s --head "$BASE_URL/" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test 6: Response time
echo -n "Test 6 - Response time: "
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$ENDPOINT")
TIME_MS=$(echo "$TIME * 1000" | bc | cut -d. -f1)
if [ "$TIME_MS" -lt 5000 ]; then
    echo -e "${GREEN}✓ PASS${NC} (${TIME_MS}ms)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ SLOW${NC} (${TIME_MS}ms)"
    ((PASSED++))
fi

# Test 7: PUT request
echo -n "Test 7 - PUT request support: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT -d "test=update" "$BASE_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Test 8: DELETE request
echo -n "Test 8 - DELETE request support: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL$ENDPOINT")
if [ "$STATUS" -ne 404 ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $STATUS)"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Status: $STATUS)"
    ((FAILED++))
fi

# Summary
echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    exit 1
fi
