# Allow running from repo root or from backend/ by handling imports flexibly
try:
    # When working directory is backend/
    from app import create_app  # type: ignore
except ImportError:
    # When working directory is repo root
    from backend.app import create_app  # type: ignore

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
