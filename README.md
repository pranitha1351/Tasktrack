# TaskTrack

**Student Assignment & Deadline Management System**

TaskTrack is a web application that helps students keep every assignment in one place, track deadlines, and see at a glance what is pending, completed or overdue.

| | |
|---|---|
| **Student** | Bommideni Pranitha |
| **Roll No** | 2403A51351 |
| **Subject** | Software Engineering and System Design |

**Project files:** [Presentation (PPTX)](TaskTrack_Presentation_Final.pptx) · [Project report (PDF)](<SESD_Project document ((2403A51351)) (1).pdf>) · [Project report (DOCX)](<SESD_Project document ((2403A51351)).docx>)

## Features

- **Add assignments** with a title, subject, due date and optional notes
- **Edit** any assignment on its own page
- **Complete / reopen** an assignment with one click
- **Delete** with a confirmation prompt
- **Instant search** that filters the list as you type
- **Dashboard counters** for total, pending, completed and overdue assignments
- **Automatic overdue detection**: any pending assignment past its due date is flagged

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask 3 |
| Database | SQLite (`tasks.db`, created automatically) |
| Frontend | HTML5 + Jinja2 templates, CSS3, JavaScript |

## How to Run

1. Install Python 3.
2. Open a terminal in the `TaskTrack` folder and install Flask:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Start the app:
   ```bash
   python app.py
   ```
4. Open **http://127.0.0.1:5000** in your browser.
5. Press `Ctrl+C` in the terminal to stop the server.

## Project Structure

```
TaskTrack_Complete_Project/
├── TaskTrack/
│   ├── app.py                 # Flask backend: routes, validation, database
│   ├── requirements.txt       # Python dependencies
│   ├── README.txt             # Short run instructions
│   ├── static/
│   │   ├── style.css          # Page design
│   │   └── script.js          # Search and delete confirmation
│   └── templates/
│       ├── index.html         # Dashboard and assignment list
│       ├── edit.html          # Edit assignment page
│       └── error.html         # 400 / 404 error page
├── TaskTrack_Presentation_Final.pptx   # Project presentation (17 slides)
└── SESD_Project document ((2403A51351)).docx / .pdf   # Project report
```

## Application Routes

| Route | Method | Purpose |
|---|---|---|
| `/` | GET | Dashboard, counters and assignment list |
| `/add` | POST | Validate and add a new assignment |
| `/edit/<id>` | GET, POST | Show the edit form, then save changes |
| `/toggle/<id>` | POST | Switch between Pending and Completed |
| `/delete/<id>` | POST | Delete an assignment |

## Database Design

Table **`assignments`**:

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER | Primary key, auto-increment |
| `title` | TEXT | Required |
| `subject` | TEXT | Required |
| `description` | TEXT | Optional |
| `due_date` | TEXT | Required, `YYYY-MM-DD` |
| `status` | TEXT | `Pending` (default) or `Completed` |

## Security

- **CSRF tokens** on every form; forged submissions are rejected with error 400
- **Parameterised SQL queries** to prevent SQL injection
- **Server-side validation** of required fields and dates
- **Automatic HTML escaping** by Jinja2 to prevent XSS

## Future Scope

- User accounts and login
- Email reminders before deadlines
- Priority levels and categories
- Calendar view of due dates
- Online deployment

> This is an educational project meant to run locally. Change `app.secret_key` in `app.py` and use a production server before deploying it publicly.
