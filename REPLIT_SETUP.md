# Replit Setup Instructions

This project is configured to work with Replit. Follow these steps to get started:

## Import to Replit

1. Go to [Replit](https://replit.com)
2. Click "Create Repl" or "+"
3. Select "Import from GitHub"
4. Paste your GitHub repository URL
5. Click "Import from GitHub"

## First Time Setup

Once the project is imported, Replit will automatically:
1. Install dependencies using `npm install`
2. Start the development server

If it doesn't start automatically, click the "Run" button.

## Accessing the Application

- The application will be available at your Repl's URL
- The development server runs on port 3000
- Replit will automatically provide a public URL for your app

## Development

- The development server will automatically reload when you make changes
- All features work the same as local development
- Files are automatically saved in Replit

## Deployment

To deploy a production build:
1. The project is configured to build static files
2. Run `npm run build` in the Shell
3. The built files will be in the `dist` directory
4. Replit can serve these static files directly

## Environment Variables

If you need to add environment variables:
1. Click on "Secrets" in the Tools panel
2. Add your environment variables there
3. They will be available as `process.env.VARIABLE_NAME`

## Troubleshooting

If the app doesn't load:
1. Check the Console for errors
2. Try running `npm install` in the Shell
3. Make sure the Run button shows the correct command: `npm run dev -- --host 0.0.0.0 --port 3000`
4. Clear your browser cache

## Notes

- The project uses Vite for fast development
- All assets in the `public` folder are served statically
- The configuration automatically detects Replit environment