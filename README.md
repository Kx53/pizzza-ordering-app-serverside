# Pizza Ordering App Server-Side
**Pizza Ordering App (Backend)**

A web-based food ordering system for restaurant dine-in customers using **React**, **Node.js**, **Vite**, **MariaDB** (use **PHPMyAdmin** to manage the database), and **Bootstrap**.

---

## Features

- Backend built with Node.js for handling pizza orders.
- Uses **MariaDB** for storing order data and menu information.
- Easy-to-use interface for customers to place orders.
- Supports database management via **PHPMyAdmin**.

---

## Installation

### 1. Clone this repository
Clone the repository to your local machine:
```bash
git clone https://github.com/Kx53/pizzza-ordering-app-serverside.git
```
### 2. Set up the database
Ensure MariaDB is installed and running on your server. You can use PHPMyAdmin to manage the database.
* Create a database and tables as required for your application.

### 4. Install Dependencies
Make sure you have Node.js installed, then run the following command to install all dependencies:

```bash
npm install
```

### 5. Start the App
For Ubuntu Servers: Use the provided shell scripts to run the app.
* ngrok.sh: Starts ngrok to allow external access to your app through the internet.
* pizza.sh: Starts the server via screen to run the app in the background.
To run both scripts, use the following commands:
```bash
./ngrok.sh
./pizza.sh
```
This will set up the application, run the server in the background, and allow it to be accessed externally via ngrok.

---

## Usage
Once the server is running, the app will be accessible externally via the ngrok URL. You can use it to test and interact with the pizza ordering system through your browser.

