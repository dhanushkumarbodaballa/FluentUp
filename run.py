import os
import sys
import subprocess
import webbrowser
import time
import socket

def free_port_if_in_use(port: int):
    """Checks if port is in use and terminates orphaned listeners on Windows."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return  # Port is free
    except Exception:
        return

    print(f"Port {port} is currently in use. Cleaning up previous instance...")
    if sys.platform == "win32":
        try:
            cmd = f'netstat -ano | findstr :{port}'
            output = subprocess.check_output(cmd, shell=True).decode()
            current_pid = str(os.getpid())
            for line in output.strip().split('\n'):
                parts = line.strip().split()
                if len(parts) >= 5 and f':{port}' in parts[1] and 'LISTENING' in parts[3]:
                    pid = parts[-1]
                    if pid != '0' and pid != current_pid:
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            time.sleep(1.2)
        except Exception as e:
            print(f"Note: Could not automatically kill PID on port {port}: {e}")

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    dist_dir = os.path.join(frontend_dir, "dist")

    print("=" * 60)
    print("   FluentUp AI — Personal AI English Tutor Agent")
    print("=" * 60)
    print(f"Project root: {root_dir}")

    # Build frontend if dist doesn't exist
    if not os.path.exists(dist_dir):
        print("\nBuilding frontend web application...")
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        try:
            subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
            print("Frontend built successfully!")
        except Exception as e:
            print(f"Warning during frontend build: {e}")

    # Ensure port 8000 is free
    port = int(os.getenv("PORT", 8000))
    free_port_if_in_use(port)

    # Ensure backend is in python path
    sys.path.insert(0, backend_dir)

    import uvicorn
    from dotenv import load_dotenv

    # Load environment variables
    load_dotenv(os.path.join(backend_dir, ".env"))
    load_dotenv(os.path.join(root_dir, ".env"))
    load_dotenv(os.path.join(backend_dir, ".env.example"))

    host = "127.0.0.1"
    url = f"http://{host}:{port}"

    print(f"\nStarting FluentUp AI on {url}")
    print("AI Chat Screen ready at home page.")
    print("Press Ctrl+C to stop the server.\n")

    def open_browser():
        time.sleep(1.5)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    import threading
    threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run("app:app", host=host, port=port, app_dir=backend_dir, reload=True)

if __name__ == "__main__":
    main()
