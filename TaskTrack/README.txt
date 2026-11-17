TASKTRACK - STUDENT ASSIGNMENT & DEADLINE MANAGEMENT SYSTEM

REQUIREMENTS
- Python 3
- Flask

INSTALL
1. Open a terminal inside the TaskTrack folder.
2. Run: python -m pip install -r requirements.txt

RUN
1. Run: python app.py
2. Open http://127.0.0.1:5000 in your browser.
3. Keep the terminal open while using the website.
4. Press Ctrl+C in the terminal to stop the server.

FILES
- app.py: Flask backend and database operations
- templates/index.html: dashboard and assignment list
- templates/edit.html: edit assignment page
- templates/error.html: error page
- static/style.css: page design
- static/script.js: search and delete confirmation
- tasks.db: created automatically when the application runs

NOTES
- The database file is created automatically in the current project folder.
- This is an educational local-development project, not a production deployment.
- Change app.secret_key to a private random value before deployment.
- Do not expose Flask's debug server to the public internet.
