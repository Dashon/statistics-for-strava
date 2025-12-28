#!/bin/bash

# Script to find all PostgreSQL compatibility issues in migrations

echo "🔍 Checking for PostgreSQL compatibility issues in migrations..."
echo ""

# Common camelCase column names that should be lowercase
COLUMNS=(
    "activityId"
    "segmentId"
    "deviceName"
    "gearId"
    "streamType"
    "sportType"
    "activityType"
    "worldType"
    "startDateTime"
    "segmentEffortId"
    "challengeId"
    "detailsHaveBeenImported"
    "markedForDeletion"
    "streamsAreImported"
    "isCommute"
    "isFavourite"
    "isRetired"
)

FOUND_ISSUES=0

echo "📋 Checking for camelCase column names in WHERE/SET clauses..."
echo "================================================================"

for col in "${COLUMNS[@]}"; do
    # Search for column in WHERE/SET clauses (but not in class names or comments)
    matches=$(grep -rn "WHERE.*$col\|SET.*$col" migrations/*.php 2>/dev/null | \
              grep "addSql" | \
              grep -v "SqlitePlatform\|PostgreSQLPlatform\|ActivityType\|SportType\|WorldType" || true)

    if [ -n "$matches" ]; then
        echo ""
        echo "⚠️  Found camelCase '$col' in SQL:"
        echo "$matches" | while read -r line; do
            echo "   $line"
        done
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
done

echo ""
echo "================================================================"
echo ""

echo "📋 Checking for boolean assignments with 0/1..."
echo "================================================================"

# Check for boolean assignments
bool_matches=$(grep -rn "= 0\|= 1" migrations/*.php | \
               grep -E "(BOOLEAN|DEFAULT)" | \
               grep "addSql" || true)

if [ -n "$bool_matches" ]; then
    echo ""
    echo "⚠️  Found potential boolean assignments with 0/1:"
    echo "$bool_matches" | while read -r line; do
        echo "   $line"
    done
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ No boolean 0/1 issues found"
fi

echo ""
echo "================================================================"
echo ""

echo "📋 Checking for SQLite-specific functions..."
echo "================================================================"

# Check for SQLite functions
sqlite_funcs=$(grep -rn "JSON_EXTRACT\|CAST.*INTEGER" migrations/*.php | \
               grep "addSql" | \
               grep -v "SqlitePlatform" || true)

if [ -n "$sqlite_funcs" ]; then
    echo ""
    echo "⚠️  Found SQLite-specific functions without platform check:"
    echo "$sqlite_funcs" | while read -r line; do
        echo "   $line"
    done
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo "✅ No SQLite function issues found"
fi

echo ""
echo "================================================================"
echo ""

if [ $FOUND_ISSUES -eq 0 ]; then
    echo "✅ No PostgreSQL compatibility issues found!"
    exit 0
else
    echo "❌ Found $FOUND_ISSUES potential issue(s)"
    echo ""
    echo "💡 Common fixes:"
    echo "   - Change camelCase to lowercase: deviceName → devicename"
    echo "   - Use TRUE/FALSE instead of 0/1 for booleans"
    echo "   - Add platform checks for SQLite-specific code"
    exit 1
fi
