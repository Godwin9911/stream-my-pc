<img src="./public/images/logo.png">
 
# Stream My PC

## About

Stream content from your PC to the internet

### How it works

This application is a Node.js application using Express.js.

<!--
**TODO: UML Diagram**

We can render UML diagrams using [Mermaid](https://mermaidjs.github.io/).


**TODO: Describe how it works**
-->

## Features

- Node.js web server using [Express.js](https://npm.im/express)
- User Interface using HTML, CSS and Javascript.
- Bootstrap
- Icons with fontawesome
- Bundling frontend JS with Browserify
- Project specific environment variables using `.env` file, see `.env.example` to see the required variables.

## How to use it

## Set up

### Requirements

- [Node.js](https://nodejs.org/)
- A Twilio account - [sign up](https://www.twilio.com/try-twilio)

### Twilio Account Settings

config values we needed to run the application can be gotten from your twilio account dashboard.

| Config&nbsp;Value | Description                                                                                                                                                  |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account&nbsp;Sid  | Your primary Twilio account identifier - find this [in the Console](https://www.twilio.com/console).                                                         |
| Api&nbsp;Key&nbsp;Sid   | Used to authenticate - [find this here](https://www.twilio.com/console).                                                         |
| Api&nbsp;Key&nbsp;Secret  | Used to authenticate - [find this here](https://www.twilio.com/console) |

### Local development

After the above requirements have been met:

1. Clone this repository and `cd` into it

```bash
git clone https://github.com/Godwin9911/stream-my-pc.git
cd stream-my-pc
```

2. Install dependencies

```bash
npm install
```

3. create .env and Set your environment variables using .env.example as a guide

```bash
ACCOUNT_SID = YOUR_TWILIO_ACCOUNT_SID
API_KEY_SID = YOUR_API_KEY_SID
API_KEY_SECRET = YOUR_API_KEY_SECRET
```

See [Twilio Account Settings](#twilio-account-settings) on how locate the necessary environment variables.

4. Bundle frontend JS

```bash
npm run build
```

5. Run the application

```bash
npm start
```

Alternatively, you can use this command to start the server in development mode. It will reload whenever you change any files.

```bash
npm run dev
```

5. Navigate to [http://localhost:5000](http://localhost:5000)

That's it!

### Tests
No Tests

### Cloud deployment

Additionally to trying out this application locally, you can deploy it to a variety of host services.

Please be aware that some of these might charge you for the usage or might make the source code for this application visible to the public. When in doubt research the respective hosting service first.

| Service                           |                                                                                                                                                                                                                           |
| :-------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Heroku](https://www.heroku.com/) | [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)                                                                                                                                       |

## Resources

-

## Contributing

This template is open source and welcomes contributions. All contributions are subject to our [Code of Conduct](https://github.com/twilio-labs/.github/blob/master/CODE_OF_CONDUCT.md).

[Visit the project on GitHub](https://github.com/twilio-labs/sample-template-nodejs)

## License

[MIT](http://www.opensource.org/licenses/mit-license.html)

## Disclaimer

No warranty expressed or implied. Software is as is.

[twilio]: https://www.twilio.com
