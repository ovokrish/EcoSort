# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/7f391ac9-328a-4e77-ada6-4cd7d8da4dcc

## API Integration

This project uses the following APIs:

- **Clarifai API**: Used for image recognition in waste classification. The application uses Clarifai's general image recognition model to identify waste items in photos.
- **Google Gemini API**: Used for detailed waste classification analysis and answering questions about waste management.

To set up these APIs:

1. Create a Clarifai account and get a Personal Access Token (PAT)
2. Create a Google Cloud account and enable the Gemini API to get an API key
3. Add these keys to the `.env` file:
   ```
   VITE_CLARIFAI_PAT=your_clarifai_pat
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/7f391ac9-328a-4e77-ada6-4cd7d8da4dcc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/7f391ac9-328a-4e77-ada6-4cd7d8da4dcc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
