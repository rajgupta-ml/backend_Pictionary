# Pictionary Game Backend

This backend code powers the functionality of a Pictionary game, utilizing Node.js and AWS services. It manages player connections, game flow, and communication among players.

## Features

- **Player Connection**: Players can connect via WebSocket to the game server.
- **Room Management**: Players can join specific rooms to play together.
- **Gameplay Logic**: Handles game initiation, termination, role assignment (e.g., drawer), and score management.
- **Drawing Capability**: Allows players to draw and guess words during the game.

## Setup

1. **Clone the Repository**: 
   ```bash
   git clone <repository-url>
   ```

2. **Install Dependencies**:
  ```bash
  npm install
  ```

## Configuration:
Set up AWS credentials and configure environment variables as required.
Ensure AWS services like API Gateway and Lambda are appropriately configured.
1. Deployment:
Deploy the backend to AWS Lambda.
Configure API Gateway to handle WebSocket connections.
2. Testing:
Test the backend by connecting clients and simulating gameplay.
Use WebSocket testing tools or develop a frontend client for interaction.
## Usage
## API Endpoints
1. Connect:
```bash
Method: WebSocket
Endpoint: $connect
Description: Handles player connection to the game server.
```
2. Join Group:
```bash
Method: WebSocket
Endpoint: /join-group
Description: Allows players to join specific rooms for gameplay.
```
3. Handle Disconnect:
``` bash
Method: WebSocket
Endpoint: /handle-disconnect
Description: Handles player disconnection and manages game flow accordingly.
```
4. Start Game:
```bash
Method: WebSocket
Endpoint: /start-game
Description: Initiates a new game round.
```
5.End Game:
```bash
Method: WebSocket
Endpoint: /end-game
Description: Terminates the ongoing game and displays scores.
```

6. Handle Guess:
``` bash
Method: WebSocket
Endpoint: /handle-guess
Description: Processes player guesses during the game.
```
7. Handle Drawing:
``` bash
Method: WebSocket
Endpoint: /handle-drawing
Description: Allows players to draw and share their drawings with other players.
```
## WebSocket Messages
Provide details about the format and structure of messages exchanged between clients and the backend for each endpoint.
## Contributing
If you're interested in contributing to this project, follow these steps:
1. Fork the repository and create a new branch for your feature or bug fix.
2. Make changes following existing style and conventions.
3. Write tests for new functionality and ensure all tests pass.
4. Submit a pull request with a clear description of changes and their purpose.
