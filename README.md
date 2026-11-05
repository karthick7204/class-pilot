# SRM Smart Attendance Tracker 🎓

**SRM Smart Attendance Tracker** is a modern, responsive web application for SRMIST students. 

Students log in directly using their official **SRM Student Portal (`sp.srmist.edu.in`) NetID and Password**. The backend securely connects to the SRMIST portal in real time, authenticates using the portal's security mechanism and live CAPTCHA, extracts their actual attendance records, and displays intelligent insights on an interactive dashboard.

---

## 🌟 Core Features

### 1. Direct SRM Student Portal Authentication
- **Live SRM CAPTCHA Relay**: Streams the actual, real-time CAPTCHA PNG directly from SRM's `SCaptchaServlet` (`sp.srmist.edu.in`) with domain-proof headers.
- **Zero Plain-Text Credential Storage**: Passwords are used strictly in temporary memory during the HTTPS handshake and are **never saved to disk or database**.
- **Real-Time Data Extraction**: Extracts actual enrolled course codes, titles, total classes conducted ($T$), classes attended ($A$), and classes absent ($T - A$).

### 2. Intelligent Mathematical Calculations
- **Calculation A: Required Classes to Reach 75%**
  $$\text{Required Classes} = \left\lceil \frac{0.75 \times T - A}{1 - 0.75} \right\rceil$$
  Rounds up to the nearest whole integer. Automatically indicates *"Already achieved"* if attendance is $\ge 75\%$.
- **Calculation B: Attendance Leave Margin (Safe Skips)**
  $$\text{Margin} = \left\lfloor \frac{A}{0.75} - T \right\rfloor$$
  Calculates how many upcoming classes can be safely missed while maintaining at least $75\%$ attendance.

### 3. Interactive Future Attendance Calculator
- Students can simulate hypothetical attendance questions:
  - *"What happens if I miss the next 3 classes?"*
  - *"What happens if I attend the next 5 classes?"*
- Real-time gauge preview with net percentage changes and shortage alerts.

### 4. Subject-Wise Analytics & Progress Bars
- Complete breakdown for every enrolled subject.
- Visual color-coded progress bars (Safe $\ge 75\%$, Warning $65\%-74\%$, Shortage $<65\%$).
- Recharts comparison bar chart with the 75% baseline reference line.

---

## 🚀 How to Run Locally

### 1. Start Backend & Frontend
From the root directory:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5002](http://localhost:5002)

### 2. Log In
1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. The login screen automatically streams the live CAPTCHA directly from `sp.srmist.edu.in`.
3. Enter your **SRM NetID** (without `@srmist.edu.in`), **Password**, and the characters shown in the CAPTCHA.
4. Click **Log In & Fetch Live Attendance**.
5. Your actual attendance details, subject-wise metrics, margins, and recovery requirements will appear immediately on your dashboard!
