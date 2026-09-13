Child-Games
Educational Games — Login & Guest System
Purpose
This code is part of an Educational Games website. Its purpose is to manage players, login accounts, guest access, and game progress.

The system allows players to either:

Create an account and save their game progress.
Log in to an existing account and continue playing.
Play as a guest without creating an account.
The main goal is to make the educational games easy to access while allowing registered players to keep their progress.

How It Works
When the website starts, the system checks whether the player has an active session.

There are two types of players:

1. Registered Player
   A registered player creates an account using:

A username
A 4-digit PIN
The account is saved in the browser using localStorage.

The player's session and game progress can therefore remain available when they return to the website.

2. Guest Player
   A guest can play without creating an account.

Guest information is stored using sessionStorage.

Guest players can play the games, but their progress is temporary and is not intended to be permanently saved.

Game Logic
The general flow of the system is:

Start Website
↓
Check for Existing Session
↓
┌───────────────┐
│ Is User Logged?│
└───────┬───────┘
│
┌────┴────┐
│ │
Yes No
│ │
│ Show Login
│ │
│ ┌────┴─────┐
│ │ │
│ Login Guest
│ │ │
└────┬──────────┘
↓
Game Hub
↓
Choose a Game
↓
Play Game
↓
Track Progress
↓
Save Progress
Login Logic
When a registered player logs in:

The username is checked.
The PIN is checked against the saved PIN hash.
If the information is correct, a user session is created.
The player is allowed to access the game hub and games.
If the username or PIN is incorrect, the login fails and an error message is shown.

Signup Logic
When creating a new account, the system checks that:

The username has at least 2 characters.
The username contains valid characters.
The PIN contains exactly 4 numbers.
The username is not already being used.
If all checks pass, the account is created and the player is automatically logged in.

Guest Logic
The guest option allows a player to immediately start playing without registering.

When guest mode is selected:

Any existing registered session is removed.
A guest session is created.
The player can access the games.
A guest message is displayed to explain that their progress is temporary.
This is useful for players who want to try the games without creating an account.

Progress Saving
The system uses browser storage to handle player information.

Registered Players
Registered-player data is stored in:

localStorage
This allows information to remain available between visits.

Guests
Guest-session information is stored in:

sessionStorage
This makes guest sessions temporary.

Authentication Protection
Game pages are protected so that a player must have a valid session before accessing them.

If someone tries to open a protected game without logging in, the system redirects them to the login page.

This prevents the games from being accessed without first selecting either:

Registered User
Guest Player
User Interface
The system can display a user bar at the top of the game.

For a registered player, it can show:

⭐ Hi, Alex!
Your stars are saved!
For a guest, it shows:

👋 Guest Player
Guest — scores reset on refresh
The user bar also provides a logout button.

Logout Logic
When the player logs out:

The current session is removed.
The player is redirected to the login page.
Registered account data and saved progress are not deleted.
Logging out only ends the current session.

Main Functions
Function Purpose
signupUser() Creates a new player account
loginUser() Logs in a registered player
loginAsGuest() Starts a guest session
logout() Ends the current session
getSession() Gets the current player's session
isGuest() Checks if the player is a guest
isLoggedIn() Checks if a registered player is logged in
requireAuth() Protects game pages from unauthorized access
initUserBar() Displays player information
initGuestBanner() Displays the guest warning
getUsers() Retrieves registered accounts
saveUsers() Saves registered accounts
Overall Purpose
The main purpose of this system is to provide a simple authentication system for an educational game platform.

It gives players two ways to use the website:

Registered Player

Create an account → Log in → Play → Save progress → Return later

Guest Player

Play immediately → Try the games → Temporary session

This makes the educational games accessible to everyone while giving registered players the benefit of saving their progress.
