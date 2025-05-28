#!/bin/bash

# Test script for GitHub Gist API
# Usage: ./test-api.sh [base_url] [bearer_token]

# Default values
BASE_URL="${1:-http://localhost:8787}"
BEARER_TOKEN="${2:-your-secret-bearer-token}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing GitHub Gist API at $BASE_URL"
echo "================================================"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Test 1: Root endpoint
echo -e "\n${YELLOW}Test 1: Root endpoint${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "200" ] && result=0 || result=1
print_result $result "GET / - Status: $http_code"
echo "Response: $body"

# Test 2: Missing auth header
echo -e "\n${YELLOW}Test 2: Missing authorization${NC}"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/gist/file/test.txt")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "401" ] && result=0 || result=1
print_result $result "GET without auth - Status: $http_code"
echo "Response: $body"

# Test 3: Invalid bearer token
echo -e "\n${YELLOW}Test 3: Invalid bearer token${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer invalid-token" "$BASE_URL/api/gist/file/test.txt")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "401" ] && result=0 || result=1
print_result $result "GET with invalid token - Status: $http_code"
echo "Response: $body"

# Test 4: Get full gist
echo -e "\n${YELLOW}Test 4: Get full gist${NC}"
response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $BEARER_TOKEN" "$BASE_URL/api/gist")
http_code=$(echo "$response" | tail -n1)
[ "$http_code" = "200" ] && result=0 || result=1
print_result $result "GET /api/gist - Status: $http_code"

# Test 5: Create a test file
echo -e "\n${YELLOW}Test 5: Create new file${NC}"
TEST_FILE="test-$(date +%s).txt"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -H "Content-Type: text/plain" \
    -d "This is a test file created at $(date)" \
    "$BASE_URL/api/gist/file/$TEST_FILE")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "201" ] && result=0 || result=1
print_result $result "POST /api/gist/file/$TEST_FILE - Status: $http_code"
echo "Response: $body"

# Test 6: Get the created file
if [ "$http_code" = "201" ]; then
    echo -e "\n${YELLOW}Test 6: Get created file${NC}"
    sleep 1 # Give GitHub a moment
    response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $BEARER_TOKEN" "$BASE_URL/api/gist/file/$TEST_FILE")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    [ "$http_code" = "200" ] && result=0 || result=1
    print_result $result "GET /api/gist/file/$TEST_FILE - Status: $http_code"
    echo "Response: $body"
    
    # Test 7: Update the file
    echo -e "\n${YELLOW}Test 7: Update file${NC}"
    response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Authorization: Bearer $BEARER_TOKEN" \
        -H "Content-Type: text/plain" \
        -d "Updated content at $(date)" \
        "$BASE_URL/api/gist/file/$TEST_FILE")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    [ "$http_code" = "200" ] && result=0 || result=1
    print_result $result "PUT /api/gist/file/$TEST_FILE - Status: $http_code"
    echo "Response: $body"
    
    # Test 8: Delete the file
    echo -e "\n${YELLOW}Test 8: Delete file${NC}"
    response=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Authorization: Bearer $BEARER_TOKEN" \
        "$BASE_URL/api/gist/file/$TEST_FILE")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    [ "$http_code" = "200" ] && result=0 || result=1
    print_result $result "DELETE /api/gist/file/$TEST_FILE - Status: $http_code"
    echo "Response: $body"
fi

# Test 9: Invalid filename
echo -e "\n${YELLOW}Test 9: Invalid filename${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    -d "test" \
    "$BASE_URL/api/gist/file/../../../etc/passwd")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "400" ] && result=0 || result=1
print_result $result "POST with path traversal - Status: $http_code"
echo "Response: $body"

# Test 10: Missing request body
echo -e "\n${YELLOW}Test 10: Missing request body${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $BEARER_TOKEN" \
    "$BASE_URL/api/gist/file/empty.txt")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')
[ "$http_code" = "400" ] && result=0 || result=1
print_result $result "POST without body - Status: $http_code"
echo "Response: $body"

echo -e "\n================================================"
echo "✅ Test suite completed!"
