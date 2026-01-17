# Student Finance Tracker (UniBudget)

## Project Overview

Student Finance Tracker, also called UniBudget, is a simple and friendly personal finance app designed to help university students manage their money. You can track income, expenses, and view transaction history, giving you a clear snapshot of your financial activity. The goal is to make it easy for students to make smarter financial choices and build good habits.

---

## Features Implemented

* **Dashboard**
* **Transaction Page** (currently uses dummy data)
* **Login & Signup Pages**
* **Profile / Account Page**
* **Database Setup**
* **Backend for Login & Signup**
* **Backend for User Avatar Uploads**
* **Add Friend Functionality & Page**
* **Friend Request Functionality & Page**

---

## Project Status

* Core pages and backend functionality are up and running.
* Some features, like **transactions**, are still using dummy data.
* Work is ongoing to implement advanced features like **shared wallets**, **budgeting**, and **notifications**.

---

## Getting Started

### Prerequisites

* Node.js (v18 or later recommended)
* npm
* MongoDB Atlas account
* Cloudinary account

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/itsHanna27/student-finance-tracker.git
   cd student-finance-tracker
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root and add your credentials:

   ```env
   MONGO_URI=your_mongodb_uri
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

   ⚠️ Do not commit your `.env` file to GitHub, as it contains sensitive credentials.

4. Run the development server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser to see the app.

---

## Tech Stack

* **Frontend:** React, CSS, React Icons
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas
* **File Storage:** Cloudinary
* **Authentication:** JWT & bcrypt

---

## Contributing

Feel free to fork the project and submit pull requests. Make sure no sensitive credentials like `.env` files are included in commits.
