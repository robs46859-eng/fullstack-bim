#!/bin/bash
# ============================================================
#  StelarBIM — AWS Deploy Script
#  Creates: RDS PostgreSQL + App Runner service
#  Account: 268054298018  |  Region: us-east-1
# ============================================================
set -e

ACCOUNT_ID="268054298018"
REGION="us-east-1"
APP_NAME="stelarbim"
DB_IDENTIFIER="stelarbim-db"
GITHUB_REPO="https://github.com/robs46859-eng/fullstack-bim"
GEMINI_KEY="${GEMINI_API_KEY:-ROTATE_THIS_KEY}"  # Key removed — set via env var only

echo ""
echo "============================================================"
echo "  StelarBIM → AWS Deployment"
echo "============================================================"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Install from https://aws.amazon.com/cli/"
  read -p "Press Enter to close..."; exit 1
fi

# Verify AWS auth
echo "Verifying AWS credentials..."
IDENTITY=$(aws sts get-caller-identity --output json 2>&1)
if [ $? -ne 0 ]; then
  echo "❌ AWS not authenticated. Run: aws configure"
  read -p "Press Enter to close..."; exit 1
fi
echo "✓ Logged in as: $(echo $IDENTITY | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["Arn"])')"

# Prompt for Anthropic key
echo ""
echo "Your Gemini key is pre-filled: AIzaSy...WeBtU"
read -p "Enter your ANTHROPIC_API_KEY (sk-ant-...): " ANTHROPIC_KEY
if [ -z "$ANTHROPIC_KEY" ]; then
  echo "⚠️  No Anthropic key provided — Claude lane will be disabled until set"
  ANTHROPIC_KEY="PLACEHOLDER_SET_IN_APP_RUNNER"
fi

echo ""
echo "------------------------------------------------------------"
echo "  STEP 1: Create RDS PostgreSQL database"
echo "------------------------------------------------------------"

# Check if RDS instance already exists
EXISTING_DB=$(aws rds describe-db-instances --db-instance-identifier $DB_IDENTIFIER --region $REGION 2>/dev/null | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["DBInstances"][0]["DBInstanceStatus"])' 2>/dev/null || echo "notfound")

if [ "$EXISTING_DB" != "notfound" ]; then
  echo "✓ RDS instance '$DB_IDENTIFIER' already exists (status: $EXISTING_DB)"
else
  echo "Creating RDS PostgreSQL instance (this takes ~5 minutes)..."
  aws rds create-db-instance \
    --db-instance-identifier $DB_IDENTIFIER \
    --db-instance-class db.t4g.micro \
    --engine postgres \
    --engine-version "16.3" \
    --master-username stelarbim \
    --master-user-password "StelarBIM2026!" \
    --allocated-storage 20 \
    --storage-type gp2 \
    --publicly-accessible \
    --no-multi-az \
    --db-name stelarbim \
    --backup-retention-period 7 \
    --region $REGION \
    --tags Key=project,Value=stelarbim \
    --output text --query 'DBInstance.DBInstanceIdentifier' > /dev/null
  echo "✓ RDS creation started. Waiting for availability (may take 5-10 min)..."
  aws rds wait db-instance-available --db-instance-identifier $DB_IDENTIFIER --region $REGION
  echo "✓ RDS is available!"
fi

# Get RDS endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_IDENTIFIER \
  --region $REGION \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)
DB_PORT=$(aws rds describe-db-instances \
  --db-instance-identifier $DB_IDENTIFIER \
  --region $REGION \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)
DATABASE_URL="postgresql://stelarbim:StelarBIM2026!@${DB_ENDPOINT}:${DB_PORT}/stelarbim"
echo "✓ Database URL: postgresql://stelarbim:***@${DB_ENDPOINT}:${DB_PORT}/stelarbim"

echo ""
echo "------------------------------------------------------------"
echo "  STEP 2: Run database schema"
echo "------------------------------------------------------------"
if command -v psql &> /dev/null; then
  echo "Running schema.sql..."
  PGPASSWORD="StelarBIM2026!" psql \
    -h "$DB_ENDPOINT" -p "$DB_PORT" \
    -U stelarbim -d stelarbim \
    -f "$(dirname "$0")/server/schema.sql" && echo "✓ Schema applied" || echo "⚠️  Schema may already exist or psql failed"
else
  echo "⚠️  psql not found — run schema.sql manually against $DB_ENDPOINT"
fi

echo ""
echo "------------------------------------------------------------"
echo "  STEP 3: Create App Runner service (GitHub source)"
echo "------------------------------------------------------------"

# Check if App Runner connection to GitHub exists
echo "Looking for existing GitHub connection..."
CONN_ARN=$(aws apprunner list-connections --region $REGION \
  --query 'ConnectionSummaryList[?ProviderType==`GITHUB`].ConnectionArn' \
  --output text 2>/dev/null | head -1)

if [ -z "$CONN_ARN" ]; then
  echo ""
  echo "⚠️  No GitHub connection found for App Runner."
  echo "    You need to create one in the AWS Console:"
  echo "    1. Go to: https://us-east-1.console.aws.amazon.com/apprunner/home#/connections"
  echo "    2. Click 'Add new' and connect your GitHub account (robs46859-eng)"
  echo "    3. Re-run this script after connecting"
  echo ""
  echo "    Saving your config for when you re-run..."
  cat > "$(dirname "$0")/.deploy-env" <<EOF
DATABASE_URL=$DATABASE_URL
GEMINI_API_KEY=$GEMINI_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
EOF
  echo "✓ Saved .deploy-env — DO NOT commit this file"
  read -p "Press Enter to close..."; exit 0
fi

echo "✓ GitHub connection found: $CONN_ARN"

# Check if App Runner service already exists
EXISTING_SVC=$(aws apprunner list-services --region $REGION \
  --query "ServiceSummaryList[?ServiceName=='$APP_NAME'].ServiceArn" \
  --output text 2>/dev/null)

if [ -n "$EXISTING_SVC" ]; then
  echo "✓ App Runner service '$APP_NAME' already exists: $EXISTING_SVC"
  echo "  Updating environment variables..."
  aws apprunner update-service \
    --service-arn "$EXISTING_SVC" \
    --source-configuration "{
      \"AutoDeploymentsEnabled\": true
    }" \
    --instance-configuration "{
      \"Cpu\": \"1 vCPU\",
      \"Memory\": \"2 GB\"
    }" \
    --region $REGION > /dev/null
else
  echo "Creating App Runner service..."
  SVC_ARN=$(aws apprunner create-service \
    --service-name $APP_NAME \
    --source-configuration "{
      \"CodeRepository\": {
        \"RepositoryUrl\": \"$GITHUB_REPO\",
        \"SourceCodeVersion\": {\"Type\": \"BRANCH\", \"Value\": \"main\"},
        \"CodeConfiguration\": {\"ConfigurationSource\": \"REPOSITORY\"}
      },
      \"ConnectionArn\": \"$CONN_ARN\",
      \"AutoDeploymentsEnabled\": true
    }" \
    --instance-configuration "{\"Cpu\": \"1 vCPU\", \"Memory\": \"2 GB\"}" \
    --region $REGION \
    --query 'Service.ServiceArn' --output text)
  echo "✓ App Runner service created: $SVC_ARN"
  EXISTING_SVC=$SVC_ARN
fi

echo ""
echo "------------------------------------------------------------"
echo "  STEP 4: Set environment variables in App Runner"
echo "------------------------------------------------------------"
aws apprunner update-service \
  --service-arn "$EXISTING_SVC" \
  --source-configuration "{
    \"CodeRepository\": {
      \"RepositoryUrl\": \"$GITHUB_REPO\",
      \"SourceCodeVersion\": {\"Type\": \"BRANCH\", \"Value\": \"main\"},
      \"CodeConfiguration\": {
        \"ConfigurationSource\": \"API\",
        \"CodeConfigurationValues\": {
          \"Runtime\": \"NODEJS_22\",
          \"BuildCommand\": \"npm ci && npm run build\",
          \"StartCommand\": \"npm start\",
          \"Port\": \"3000\",
          \"RuntimeEnvironmentVariables\": {
            \"DATABASE_URL\": \"$DATABASE_URL\",
            \"GEMINI_API_KEY\": \"$GEMINI_KEY\",
            \"ANTHROPIC_API_KEY\": \"$ANTHROPIC_KEY\",
            \"NODE_ENV\": \"production\",
            \"PORT\": \"3000\"
          }
        }
      }
    },
    \"ConnectionArn\": \"$CONN_ARN\",
    \"AutoDeploymentsEnabled\": true
  }" \
  --region $REGION > /dev/null
echo "✓ Environment variables set"

echo ""
echo "------------------------------------------------------------"
echo "  STEP 5: Get App Runner URL"
echo "------------------------------------------------------------"
APP_URL=$(aws apprunner describe-service \
  --service-arn "$EXISTING_SVC" \
  --region $REGION \
  --query 'Service.ServiceUrl' \
  --output text 2>/dev/null)
echo "✓ App Runner URL: https://$APP_URL"
echo ""
echo "  Next: Point arkhamprison.com → $APP_URL"
echo "  In your DNS (Hostinger or Route 53):"
echo "    CNAME  @  →  $APP_URL"
echo "    CNAME  www →  $APP_URL"

echo ""
echo "============================================================"
echo "  ✅ Deployment complete!"
echo "  App URL: https://$APP_URL"
echo "  Dashboard: https://$APP_URL/dashboard/cockpit"
echo "  GitHub: $GITHUB_REPO"
echo "============================================================"
echo ""
read -p "Press Enter to close..."
