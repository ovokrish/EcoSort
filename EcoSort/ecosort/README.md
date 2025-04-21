<<<<<<< HEAD
# EcoSort - Waste Classification App
=======

>>>>>>> 8e0daba4844153955df6b2c0fc7def8812150d54

EcoSort is an interactive application designed to promote sustainable waste management through gamification and education. Users can scan waste items to classify them, earn points, and compete on a global leaderboard. The app aims to encourage proper recycling habits while fostering an environmentally conscious community.

<<<<<<< HEAD
## Features

- **Waste Scanning & Classification**: Identify waste items using image recognition (Gemini API)
- **Gamification**: Earn points for recycling and climb the global leaderboard
- **User Profiles**: Track your progress and scan history
- **Educational Content**: Learn about proper waste disposal methods

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Node.js
- **Authentication**: Supabase
- **Database**: Supabase
- **Image Recognition**: Google Gemini API
- **Chat Functionality**: MongoDB

=======
>>>>>>> 8e0daba4844153955df6b2c0fc7def8812150d54
## API Integration

This project uses the following APIs:

- **Google Gemini API**: Used for detailed waste classification analysis and answering questions about waste management.

To set up these APIs:

1. Create a Google Cloud account and enable the Gemini API to get an API key
2. Add these keys to the `.env` file:
   ```
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

<<<<<<< HEAD
## Getting Started with VSCode

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd EcoSort/ecosort
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the project root with the following:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open in VSCode**
   ```bash
   code .
   ```

6. **VSCode Extensions**
   For the best development experience, install these extensions:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - ES7 React/Redux/GraphQL/React-Native snippets

## Accessing the App

Once the development server is running, access the app at:
```
http://localhost:5173/
```

## How to Edit This Code

You can edit this code using any code editor or IDE of your choice. The only requirement is having Node.js & npm installed.

Follow these steps to set up your development environment:

```sh
# Step 1: Clone the repository
git clone <repository-url>

# Step 2: Navigate to the project directory
cd EcoSort/ecosort

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server with auto-reloading
npm run dev
```

## Deployment

This application can be deployed to any hosting service that supports Node.js applications, such as:

- Vercel
- Netlify
- Heroku
- AWS Amplify
- Digital Ocean
=======
>>>>>>> 8e0daba4844153955df6b2c0fc7def8812150d54
