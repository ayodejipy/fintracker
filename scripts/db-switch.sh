#!/bin/bash

# Database Connection Switcher
# Helps switch between local and Supabase databases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Show current database configuration
show_current() {
    print_info "Current DATABASE_URL:"
    if [ -f .env ]; then
        grep "^DATABASE_URL=" .env || echo "Not set"
    else
        print_warning ".env file not found"
    fi
}

# Switch to local database
use_local() {
    print_info "Switching to local PostgreSQL database..."

    if [ ! -f .env ]; then
        print_error ".env file not found. Creating from .env.example..."
        cp .env.example .env
    fi

    # Update DATABASE_URL in .env
    if grep -q "^DATABASE_URL=" .env; then
        sed -i.bak 's|^DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_finance_db"|' .env
        rm -f .env.bak
    else
        echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/personal_finance_db"' >> .env
    fi

    # Update NODE_ENV
    if grep -q "^NODE_ENV=" .env; then
        sed -i.bak 's|^NODE_ENV=.*|NODE_ENV="development"|' .env
        rm -f .env.bak
    else
        echo 'NODE_ENV="development"' >> .env
    fi

    print_success "Switched to local database"
    show_current
}

# Switch to Supabase (pooled - for application)
use_supabase_pooled() {
    print_info "Switching to Supabase (connection pooling)..."
    print_warning "This is for APPLICATION RUNTIME only, not migrations!"

    read -p "Enter your Supabase connection string (pooled - port 6543): " SUPABASE_URL

    if [ -z "$SUPABASE_URL" ]; then
        print_error "Connection string cannot be empty"
        exit 1
    fi

    if [ ! -f .env ]; then
        print_error ".env file not found. Creating from .env.example..."
        cp .env.example .env
    fi

    # Update DATABASE_URL in .env
    if grep -q "^DATABASE_URL=" .env; then
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_URL\"|" .env
        rm -f .env.bak
    else
        echo "DATABASE_URL=\"$SUPABASE_URL\"" >> .env
    fi

    # Update NODE_ENV
    if grep -q "^NODE_ENV=" .env; then
        sed -i.bak 's|^NODE_ENV=.*|NODE_ENV="production"|' .env
        rm -f .env.bak
    else
        echo 'NODE_ENV="production"' >> .env
    fi

    print_success "Switched to Supabase (pooled)"
    show_current
}

# Switch to Supabase (direct - for migrations)
use_supabase_direct() {
    print_info "Switching to Supabase (direct connection)..."
    print_warning "This is for MIGRATIONS only, not application runtime!"

    read -p "Enter your Supabase connection string (direct - port 5432): " SUPABASE_URL

    if [ -z "$SUPABASE_URL" ]; then
        print_error "Connection string cannot be empty"
        exit 1
    fi

    if [ ! -f .env ]; then
        print_error ".env file not found. Creating from .env.example..."
        cp .env.example .env
    fi

    # Update DATABASE_URL in .env
    if grep -q "^DATABASE_URL=" .env; then
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$SUPABASE_URL\"|" .env
        rm -f .env.bak
    else
        echo "DATABASE_URL=\"$SUPABASE_URL\"" >> .env
    fi

    print_success "Switched to Supabase (direct)"
    show_current
}

# Test database connection
test_connection() {
    print_info "Testing database connection..."

    if ! command -v psql &> /dev/null; then
        print_warning "psql not installed. Testing via Prisma..."
        npx prisma db execute --stdin <<< "SELECT 1;"
    else
        if [ -f .env ]; then
            DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
            psql "$DB_URL" -c "SELECT 1;" > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                print_success "Database connection successful!"
            else
                print_error "Database connection failed!"
                exit 1
            fi
        else
            print_error ".env file not found"
            exit 1
        fi
    fi
}

# Show help
show_help() {
    cat << EOF
${BLUE}Database Connection Switcher${NC}

Usage: ./scripts/db-switch.sh [COMMAND]

Commands:
  local              Switch to local PostgreSQL database
  supabase-pooled    Switch to Supabase with connection pooling (for app)
  supabase-direct    Switch to Supabase direct connection (for migrations)
  current            Show current database configuration
  test               Test database connection
  help               Show this help message

Examples:
  ./scripts/db-switch.sh local              # Use local database
  ./scripts/db-switch.sh supabase-pooled    # Use Supabase for production
  ./scripts/db-switch.sh current            # Show current config
  ./scripts/db-switch.sh test               # Test connection

${YELLOW}Notes:${NC}
  - Use 'local' for development
  - Use 'supabase-pooled' for production runtime
  - Use 'supabase-direct' when running migrations
  - Always test connection after switching

${GREEN}Quick Reference:${NC}
  Port 5432 = Direct connection (migrations)
  Port 6543 = Connection pooling (application)

For more details, see docs/SUPABASE_SETUP.md
EOF
}

# Main script logic
case "${1}" in
    local)
        use_local
        ;;
    supabase-pooled)
        use_supabase_pooled
        ;;
    supabase-direct)
        use_supabase_direct
        ;;
    current)
        show_current
        ;;
    test)
        test_connection
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: ${1}"
        echo ""
        show_help
        exit 1
        ;;
esac
