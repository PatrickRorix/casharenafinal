# CashArena

CashArena is a dynamic cryptocurrency gaming platform that delivers an immersive, socially-connected gaming experience with advanced lobby management and real-time interaction tools.

![CashArena](https://i.imgur.com/Yw8uU1r.png) <!-- Add your logo image URL here -->

## 🎮 Features

- **Multi-game Support**: Play competitive matches across various popular games, starting with CS2
- **Advanced Lobby System**: Create and join lobby for both 1v1 and team-based 5v5 matches
- **Team Management**: Create teams, invite members, and manage team rosters
- **Tournament System**: Participate in organized tournaments with brackets and prizes
- **Wallet Integration**: Manage your WinTokens (platform currency) with secure transactions
- **Social Features**: Add friends, chat in real-time, and build your gaming network
- **Match Verification**: Submit and verify match results with an admin review system
- **User Profiles**: Track your stats, match history, and earnings

 ![Dashboard](https://i.imgur.com/A67EvpY.png)!
 ![Wallet](https://i.imgur.com/9oysfwg.png)

## 🚀 Technology Stack

### Frontend
- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **TailwindCSS**: Utility-first CSS framework for styling
- **shadcn/ui**: High-quality UI components
- **TanStack Query**: Data fetching and state management
- **WebSockets**: Real-time communications for chat and notifications
- **wouter**: Lightweight routing library

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web framework for building the API
- **PostgreSQL**: Relational database for data storage
- **Drizzle ORM**: Database query builder and ORM
- **Passport.js**: Authentication middleware
- **Stripe**: Payment processing

## 📋 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Stripe account (for payment processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/PatrickRorix/casharena.git
   cd casharena
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables

4. Set up the database
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:5000`

## 💼 Project Structure

```
/
├── client/ - React frontend
│   ├── src/
│   │   ├── components/ - Reusable UI components
│   │   ├── hooks/ - Custom React hooks
│   │   ├── lib/ - Utility functions
│   │   └── pages/ - Page components
├── server/ - Express backend
│   ├── routes/ - API route handlers
│   └── middleware/ - Express middleware
└── shared/ - Code shared between client and server
    └── schema.ts - Database schema definitions
```

## 🔄 Current State & Roadmap

### Implemented
- User authentication system
- Team and lobby management
- Real-time chat in lobbies
- WinToken wallet implementation
- Basic admin dashboard

### Future Plans
- Tournament bracket visualization
- Enhanced user profiles and statistics
- Game server integration for CS2
- Mobile responsiveness
- Anti-cheat integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Patrick Rorix](https://github.com/PatrickRorix)

## 🙏 Acknowledgements

- [Stripe](https://stripe.com/) for payment processing
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [TanStack Query](https://tanstack.com/query) for data fetching
