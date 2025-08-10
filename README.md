## Configuration

Before running the server, you need to set up your environment variables.

1.  Create a copy of the example environment file. In your terminal, run:
    ```bash
    cp .env.example .env
    ```

2.  Open the new `.env` file and fill in the required values.

### Environment Variables

* **`PORT`**: The port the server will run on (e.g., `8080`).
* **`MONGODB_URL`**: The full connection string for your database.
* **`JWT_SECRET`**: A long, random, secret string used for signing authentication tokens.
