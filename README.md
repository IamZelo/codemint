# Project Overview

This is a personal finance tracker application called **ForeFunds**. It is a React-based web application that helps users track their income and expenses, set financial goals, and gain insights into their spending habits through AI-powered analysis. The application uses Firebase for authentication and database services, and Recharts for data visualization.

## Key Technologies

*   **Frontend:** React, Tailwind CSS
*   **Build Tool:** Vite
*   **Backend:** Firebase (Authentication, Firestore)
*   **Charting:** Recharts
*   **AI:** Google Gemini

# Building and Running

To build and run this project, you need to have Node.js and npm installed.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your Firebase and Gemini API keys:
    ```
    VITE_FIREBASE_API_KEY="your-key-here"
    VITE_FIREBASE_AUTH_DOMAIN="your-auth-domain-here"
    VITE_FIREBASE_PROJECT_ID="your-project-id-here"
    VITE_FIREBASE_STORAGE_BUCKET="your-storage-bucket-here"
    VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id-here"
    VITE_FIREBASE_APP_ID="your-app-id-here"
    VITE_GEMINI_API_KEY="your-gemini-api-key-here"
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

4.  **Build for Production:**
    ```bash
    npm run build
    ```

# Development Conventions

*   **Component-Based Architecture:** The application is built using a component-based architecture with React.
*   **Styling:** Tailwind CSS is used for styling the components.
*   **Linting:** ESLint is used for linting the code. You can run the linter with `npm run lint`.
*   **Firebase Integration:** The application uses Firebase for authentication and database services. All Firebase-related code is located in `src/App.jsx`.
*   **State Management:** The application uses React's built-in state management (`useState`, `useEffect`, `useCallback`, `useMemo`).
