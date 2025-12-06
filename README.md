# FinderDrive

**macOS Finder-style Google Drive Client**

FinderDrive is a modern, high-performance web client for Google Drive that replicates the intuitive **Column View** navigation of macOS Finder. Built with React and designed with a sleek glassmorphism aesthetic, it offers a fast and fluid way to browse and manage your cloud files.

![FinderDrive UI Mockup](https://via.placeholder.com/800x450?text=FinderDrive+Column+View+UI) *Note: Add a real screenshot here later!*

## 🚀 Features

-   **Column View Navigation**: Browse deep folder hierarchies horizontally without losing context, just like on a Mac.
-   **Google Drive Integration**: Seamless access to your "My Drive" and "Shared with me" files.
-   **Glassmorphism Design**: A premium, modern UI featuring frosted glass effects and smooth animations.
-   **Instant Navigation**: Intelligent caching with IndexedDB ensures near-instant folder loads after the first visit.
-   **File Management**: (In Progress) Rename, move, and organize files with intuitive context menus and drag-and-drop.
-   **Secure**: Powered by Google OAuth 2.0 ensuring your credentials remain safe.

## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand
-   **API**: Google Drive API (gapi)
-   **Persistence**: IndexedDB (idb)
-   **Deployment**: Firebase Hosting

## 🏁 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   A Google Cloud Project with the **Google Drive API** enabled.
-   An **OAuth 2.0 Client ID** configured in the Google Cloud Console.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/finderdrive.git
    cd finderdrive
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Configuration

1.  Create a `.env` file in the root directory by copying the example:
    ```bash
    cp .env.example .env
    ```

2.  Open `.env` and configure your **Google Client ID**:
    ```env
    VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
    ```

    > **Note:** Ensure your Google Cloud Console "Authorized JavaScript origins" includes `http://localhost:5173`.

### Running Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to start browsing your Drive!

## 📦 Deployment

For detailed instructions on deploying to **Firebase Hosting** or building for production, please refer to the [Deployment Guide](./deploy.md).

## 🤝 Contributing

Contributions are welcome! If you'd like to improve FinderDrive, please:

1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
