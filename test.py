import os
import sys
from urllib.parse import urlparse
import psycopg
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

# Replace with your env variable name or paste string directly for a quick test
CONNECTION_STRING = os.getenv("DATABASE_URL", "postgresql://postgres.xxxx:your-password@aws-0-region.pooler.supabase.com:6543/postgres")

def sanitize_uri(uri: str) -> str:
    """Mask password for safe logging."""
    parsed = urlparse(uri)
    if parsed.password:
        return uri.replace(parsed.password, "********")
    return uri

def verify_supabase_connection(connection_string: str) -> bool:
    print(f"🔍 Testing connection to: {sanitize_uri(connection_string)}")
    
    # Fast basic syntax check via URI parsing
    try:
        parsed = urlparse(connection_string)
        if parsed.scheme not in ("postgresql", "postgres"):
            print("❌ Invalid Scheme: Connection string must start with 'postgresql://' or 'postgres://'")
            return False
        if not parsed.hostname or not parsed.username:
            print("❌ Malformed URI: Hostname or Username is missing.")
            return False
    except Exception as parse_err:
        print(f"❌ Failed to parse connection URI: {parse_err}")
        return False

    # Attempt database connection
    try:
        # connect_timeout prevents hanging if host/port is unreachable
        with psycopg.connect(connection_string, connect_timeout=5) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                db_version = cur.fetchone()[0]
                
                print("\n✅ Connection Successful!")
                print(f"🐘 Database Engine: {db_version.split()[0]} {db_version.split()[1]}")
                return True

    except psycopg.OperationalError as e:
        print("\n❌ Connection Failed!")
        error_msg = str(e)
        
        # Friendly diagnostic hints
        if "password authentication failed" in error_msg:
            print("👉 Reason: Invalid password or username.")
        elif "could not translate host name" in error_msg or "Name or service not known" in error_msg:
            print("👉 Reason: Incorrect host address / project reference.")
        elif "timeout expired" in error_msg:
            print("👉 Reason: Network timeout. Check if port (5432 / 6543) is blocked by firewall or ISP.")
        else:
            print(f"👉 Error Details: {error_msg.strip()}")
            
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        conn_str = sys.argv[1]
    else:
        conn_str = CONNECTION_STRING

    success = verify_supabase_connection(conn_str)
    sys.exit(0 if success else 1)