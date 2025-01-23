# URL Shortener with Admin Dashboard

A modern URL shortener application built with Next.js, MongoDB, and Tailwind CSS. Features include:

- Admin authentication system
- URL shortening with custom short codes
- Click tracking for each shortened URL
- Beautiful and responsive UI
- Secure API endpoints
- MongoDB database integration

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your configuration:
   - Set up a MongoDB database and add the connection string
   - Generate a random string for NEXTAUTH_SECRET
   - Set NEXTAUTH_URL to your application URL

4. Create an admin user in MongoDB:
   - Connect to your MongoDB database
   - Create a user with email and hashed password
   - Set isAdmin to true

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Build for production:
   ```bash
   npm run build
   ```

7. Deploy to Vercel:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy!

## Features

- **Admin Authentication**: Secure login system for administrators
- **URL Management**: Create and track shortened URLs
- **Statistics**: View click counts and creation dates for each URL
- **Responsive Design**: Works great on both desktop and mobile
- **API Security**: Protected endpoints with session validation

## Tech Stack

- Next.js 14
- MongoDB with Mongoose
- NextAuth.js for authentication
- Tailwind CSS for styling
- TypeScript for type safety
