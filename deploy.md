# Deployment Guide

This guide covers how to run the FinderDrive application locally and how to deploy it to Firebase Hosting.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (v18 or higher recommended).
- **Google Cloud Console Project**: You need a Google Cloud project with the Google Drive API enabled and an OAuth 2.0 Client ID created.

## Configuration

1.  **Environment Variables**:
    Create a `.env` file in the root directory (copy from `.env.example`):
    ```bash
    cp .env.example .env
    ```
    Open `.env` and set your Google Client ID:
    ```env
    VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    ```

2.  **Google Cloud Console**:
    -   Go to [Google Cloud Console](https://console.cloud.google.com/).
    -   Navigate to **APIs & Services > Credentials**.
    -   Edit your OAuth 2.0 Client ID.
    -   **Authorized JavaScript origins**:
        -   Add `http://localhost:5173` (for local development).
        -   Add your Firebase hosting domain (e.g., `https://your-project-id.web.app`) once you have it.
    -   **Authorized redirect URIs**:
        -   Add `http://localhost:5173`
        -   Add your Firebase hosting domain.

## Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The app should now be running at `http://localhost:5173`.

## Production Build (Local Preview)

To test the production build locally before deploying:

1.  **Build the Project**:
    ```bash
    npm run build
    ```
    This compiles the application into the `dist` directory.

2.  **Preview the Build**:
    ```bash
    npm run preview
    ```
    This serves the built application at `http://localhost:4173`.

## Firebase Deployment

1.  **Install Firebase CLI**:
    If you haven't installed the Firebase CLI yet, run:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Login to Firebase**:
    ```bash
    firebase login
    ```

3.  **Initialize Firebase**:
    Run this command in the project root:
    ```bash
    firebase init hosting
    ```
    -   **Select a project**: Choose your existing Google Cloud project or create a new one.
    -   **What do you want to use as your public directory?**: Type `dist` and press Enter.
    -   **Configure as a single-page app (rewrite all urls to /index.html)?**: Type `y` and press Enter.
    -   **Set up automatic builds and deploys with GitHub?**: Type `n` (unless you want to set this up).
    -   **File dist/index.html already exists. Overwrite?**: Type `n` (if prompted, to preserve your build).

4.  **Deploy**:
    Every time you want to deploy a new version:

    Build the project first (important!):
    ```bash
    npm run build
    ```

    Deploy to Firebase:
    ```bash
    firebase deploy
    ```

    The CLI will output your **Hosting URL** (e.g., `https://your-project.web.app`).

5.  **Final Step**:
    Don't forget to add this new Hosting URL to your **Authorized JavaScript origins** in the Google Cloud Console (as mentioned in the Configuration section) so that Google Sign-In works on the deployed site.
