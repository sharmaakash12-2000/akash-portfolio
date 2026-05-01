# ================== FINAL app.py (ADMIN + OTP LOGIN SYSTEM) ==================
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from datetime import datetime , timedelta
import sqlite3, random, smtplib
from werkzeug.security import generate_password_hash, check_password_hash
import os
import requests

app = Flask(__name__)
app.secret_key = "supersecretkey"

ADMIN_PASSWORD = "akash@admin"

# ================== DATABASE ==================
conn = sqlite3.connect("users.db", check_same_thread=False)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS users(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    password TEXT
)
""")
conn.commit()

# ================== EMAIL FUNCTION ==================
def send_email(to_email, subject, body_text):
    api_key = os.getenv("RESEND_API_KEY")

    response = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "from": "onboarding@resend.dev",
            "to": to_email,
            "subject": subject,
            "text": body_text
        }
    )

    print(response.text)

# ================== VISITOR TRACKING ==================
visitors = []

@app.route("/")
def home():
    return render_template("index.html", show_profile=False)

@app.route("/visit", methods=["POST"])
def visit():
    data = request.json
    visitors.append({
        "name": data.get("name"),
        "email": data.get("email"),
        "purpose": data.get("purpose"),
        "time": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "ip": request.remote_addr
    })
    return jsonify({"status": "ok"})

def visitor_stats():
    total = len(visitors)
    purpose_count = {}
    today = datetime.now().strftime("%d %b %Y")
    today_count = 0

    for v in visitors:
        purpose = v["purpose"]
        purpose_count[purpose] = purpose_count.get(purpose, 0) + 1

        if today in v["time"]:
            today_count += 1

    return {
        "total": total,
        "purpose": purpose_count,
        "today": today_count
    }

# ================== USER SIGNUP ==================
@app.route("/signup", methods=["GET","POST"])
def signup():
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = generate_password_hash(request.form.get("password"))

        cursor.execute("INSERT INTO users(username,email,password) VALUES (?,?,?)",
                       (username,email,password))
        conn.commit()

        return redirect("/login")

    return render_template("signup.html")

# ================== SEND OTP ==================
@app.route("/send-otp", methods=["POST"])
def send_otp():
    data = request.json
    email = data.get("email")

    if "'" in email or "--" in email:
        return jsonify({"status": "invalid"})
    
    if len(email) > 50:
        return jsonify({"status": "invalid"})

    otp = str(random.randint(100000, 999999))
    session["otp"] = otp
    session["email"] = email

    session["otp_expiry"] = (datetime.now() + timedelta(minutes=10)).strftime("%Y-%m-%d %H:%M:%S")

    print("OTP:", otp)

    send_email(
    email,
    "Portfolio Access Verification",
    f"""Hello,

Thank you for visiting Akash Sharma's Portfolio.

Your One-Time Password (OTP) for secure login is:

🔐 {otp}

This OTP is valid for 10 min only. Please do not share it with anyone.

If you did not request this, you can safely ignore this email.

------------------------------------
Akash Sharma
Data Analyst | Python | SQL | Power BI
------------------------------------
"""
)

    return jsonify({"status": "success"})

# ================== VERIFY OTP ==================
@app.route("/verify-otp", methods=["POST"])
def verify_otp():
    data = request.json
    user_otp = data.get("otp")

    if user_otp == session.get("otp"):
        session["verified"] = True

        email = session.get("email")

        # ✅ WELCOME EMAIL
        send_email(
    email,
    "Welcome to Akash's Portfolio",
    """Hello,

Your email has been successfully verified.

Welcome to Akash Sharma's Portfolio. You can now explore projects, resume, and more.

Thank you for visiting.

------------------------------------
Akash Sharma
Data Analyst | Python | SQL | Power BI
------------------------------------
"""
)

        return jsonify({"status": "success"})
    else:
        return jsonify({"status": "fail"})


# ================== USER DASHBOARD ==================
@app.route("/dashboard")
def dashboard():
    if not session.get("user"):
        return redirect("/")

    return render_template("index.html", show_profile=True)

# ================== ADMIN LOGIN ==================
@app.route("/admin-login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        password = request.form.get("password")
        if password == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin"))
        else:
            error = "Invalid password"
    return render_template("admin_login.html", error=error)


# ================== ADMIN PANEL ==================
@app.route("/admin")
def admin():
    if not session.get("admin"):
        return redirect(url_for("admin_login"))

    stats = visitor_stats()
    return render_template("admin.html", visitors=visitors, stats=stats)


# ================== ADMIN LOGOUT ==================
@app.route("/admin-logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))


# ================== RUN ==================
if __name__ == "__main__":
    app.run(debug=True)