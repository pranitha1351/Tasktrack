from flask import Flask, render_template, request, redirect, url_for, session, abort
import os
import sqlite3
import secrets
from datetime import date

app = Flask(__name__)
app.secret_key = "change-this-secret-key-before-deployment"
# Keep the database next to app.py no matter which folder the server is started from.
DB_NAME = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tasks.db")


def get_db():
    """Open a database connection."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create the assignments table if it does not exist."""
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            description TEXT DEFAULT '',
            due_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending'
        )
    """)
    conn.commit()
    conn.close()


# Create the table on startup, whether launched with "python app.py" or "flask run".
init_db()


def get_csrf_token():
    """Create a session token used to protect forms."""
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(16)
    return session["csrf_token"]


app.jinja_env.globals["csrf_token"] = get_csrf_token


@app.before_request
def protect_post_requests():
    """Check the token on every form submission."""
    if request.method == "POST":
        submitted_token = request.form.get("csrf_token", "")
        saved_token = session.get("csrf_token", "")
        if not saved_token or not secrets.compare_digest(
            submitted_token, saved_token
        ):
            abort(400, description="Invalid form token. Refresh the page and try again.")


def valid_assignment_form(form):
    """Check required fields and ensure the date is valid."""
    title = form.get("title", "").strip()
    subject = form.get("subject", "").strip()
    description = form.get("description", "").strip()
    due_date = form.get("due_date", "").strip()

    try:
        date.fromisoformat(due_date)
        valid_date = True
    except ValueError:
        valid_date = False

    if not title or not subject or not valid_date:
        return None

    return {
        "title": title,
        "subject": subject,
        "description": description,
        "due_date": due_date,
    }


@app.route("/")
def index():
    conn = get_db()
    tasks = conn.execute(
        "SELECT * FROM assignments ORDER BY due_date ASC, id DESC"
    ).fetchall()
    conn.close()

    today = date.today().isoformat()
    total = len(tasks)
    completed = sum(task["status"] == "Completed" for task in tasks)
    overdue = sum(
        task["status"] == "Pending" and task["due_date"] < today
        for task in tasks
    )
    pending = total - completed - overdue

    return render_template(
        "index.html",
        tasks=tasks,
        total=total,
        pending=pending,
        completed=completed,
        overdue=overdue,
        today=today,
    )


@app.route("/add", methods=["POST"])
def add():
    assignment = valid_assignment_form(request.form)

    if assignment is None:
        return redirect(url_for("index", error="invalid"))

    conn = get_db()
    conn.execute(
        """INSERT INTO assignments (title, subject, description, due_date)
           VALUES (?, ?, ?, ?)""",
        (
            assignment["title"],
            assignment["subject"],
            assignment["description"],
            assignment["due_date"],
        ),
    )
    conn.commit()
    conn.close()
    return redirect(url_for("index", message="added"))


@app.route("/edit/<int:task_id>", methods=["GET", "POST"])
def edit(task_id):
    conn = get_db()
    task = conn.execute(
        "SELECT * FROM assignments WHERE id = ?", (task_id,)
    ).fetchone()

    if task is None:
        conn.close()
        abort(404)

    if request.method == "POST":
        assignment = valid_assignment_form(request.form)
        if assignment is None:
            conn.close()
            return redirect(url_for("edit", task_id=task_id, error="invalid"))

        conn.execute(
            """UPDATE assignments
               SET title = ?, subject = ?, description = ?, due_date = ?
               WHERE id = ?""",
            (
                assignment["title"],
                assignment["subject"],
                assignment["description"],
                assignment["due_date"],
                task_id,
            ),
        )
        conn.commit()
        conn.close()
        return redirect(url_for("index", message="updated"))

    conn.close()
    return render_template("edit.html", task=task)


@app.route("/toggle/<int:task_id>", methods=["POST"])
def toggle(task_id):
    conn = get_db()
    task = conn.execute(
        "SELECT status FROM assignments WHERE id = ?", (task_id,)
    ).fetchone()

    if task is not None:
        new_status = "Pending" if task["status"] == "Completed" else "Completed"
        conn.execute(
            "UPDATE assignments SET status = ? WHERE id = ?",
            (new_status, task_id),
        )
        conn.commit()

    conn.close()
    return redirect(url_for("index", message="status"))


@app.route("/delete/<int:task_id>", methods=["POST"])
def delete(task_id):
    conn = get_db()
    conn.execute("DELETE FROM assignments WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return redirect(url_for("index", message="deleted"))


@app.errorhandler(400)
def bad_request(error):
    return render_template(
        "error.html",
        code=400,
        message=getattr(error, "description", "Invalid request."),
    ), 400


@app.errorhandler(404)
def not_found(error):
    return render_template(
        "error.html",
        code=404,
        message="The requested assignment or page was not found.",
    ), 404


if __name__ == "__main__":
    app.run(debug=True)
