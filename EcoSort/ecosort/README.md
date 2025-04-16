

## Project info

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

