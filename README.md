# 🎁 GiftGenie – Offline Gift Shop Management System

GiftGenie is an offline-first mobile application developed to help gift shop owners manage their daily business operations efficiently. The application is built using **React Native, Expo and TypeScript**, with SQLite for local data storage.

The main objective of GiftGenie is to simplify gift shop management by providing inventory control, customer management, order tracking, sales monitoring and business analytics in one mobile application.

## ✨ Main Features

- **Inventory Management** – Add, edit, delete and manage products, prices and stock quantities.
- **Customer History** – Maintain customer details and view previous purchases and order history.
- **Order Management** – Create and manage customer orders with priority levels, statuses and due dates.
- **Sales Management** – Record sales and monitor sales history.
- **Gift Bundle Creator** – Create gift bundles using multiple products and calculate costs and selling prices.
- **Business Analytics** – Monitor sales, expenses, profits and business performance.
- **Low Stock Alerts** – Get notified when product stock reaches the configured threshold.
- **Order Reminders** – Receive reminders about upcoming order due dates.
- **Smart Business Suggestions** – Get suggestions for restocking and upcoming seasonal occasions.
- **Offline Backup & Restore** – Export and restore business data without requiring an internet connection.
- **Theme Settings** – Switch between Light Mode, Dark Mode and System Default.

## 🆕 Recent Updates

### Product Photo Management
- Added optional product photo selection in the Add/Edit Product forms.
- Users can select, change or remove product photos.
- Product photos are saved locally with product data in SQLite.
- Product photos are included in backup data.

### Automatic Date Added
- Product creation date is automatically recorded when a product is saved.
- The date is displayed in the product form and product details screen.

### Today Date Selection
A **Today** button has been added to:
- Order due-date selection.
- Analytics expense-date selection.
- Custom analytics date filters.

## 🛠️ Technologies Used

- React Native
- Expo
- TypeScript
- Expo Router
- SQLite
- AsyncStorage

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kaveewijesooriya/GiftGenie.git
```

### 2. Navigate to the project directory

```bash
cd GiftGenie
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the application

```bash
npx expo start
```

Follow the terminal instructions to open the application using an available development environment or device.

## 🧪 Testing and Verification

The following checks have successfully passed after the recent updates:

- TypeScript check (`npx tsc --noEmit`)
- Lint check
- Expo Doctor
- Database migration check
- Android bundle build

**Note:** Manual testing on a physical Android device or emulator has not yet been performed.

## 📱 Project Structure

The application uses Expo Router for file-based navigation. Application routes and screens are organized inside the `src/app` directory.

## 🎯 Expected Outcome

GiftGenie aims to provide a simple, reliable and user-friendly offline solution for gift shop owners. It helps reduce manual work, improve inventory management, organize customer orders, track sales and support better business decisions.

## 👨‍💻 Developer

**Project:** GiftGenie – Offline Gift Shop Management System

**GitHub Repository:** https://github.com/kaveewijesooriya/GiftGenie

