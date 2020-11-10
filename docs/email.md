# Email

Staart API supports sending transactions emails. You can send emails using any SMTP provider or [nodemailer/nodemailer](https://github.com/nodemailer/nodemailer)-supported configuration, such as AWS SES or `sendmail`.

## Configuration

You can set the following environment variables to specify the name and from email address:

| Environment variable | Description         |
| -------------------- | ------------------- |
| `EMAIL_NAME`         | Name of the service |
| `EMAIL_FROM`         | From email address  |

If you want to use SMTP, you should additionally set the configuration:

| Environment variable | Description      |
| -------------------- | ---------------- |
| `EMAIL_HOST`         | Host             |
| `EMAIL_PORT`         | Port             |
| `EMAIL_SECURE`       | Secure (boolean) |
| `EMAIL_USER`         | Username         |
| `EMAIL_PASSWORD`     | Password         |

Alternately, if you want to use AWS SES, you should set these instead (note that you can also use SMTP with SES):

| Environment variable          | Description    |
| ----------------------------- | -------------- |
| `EMAIL_SES_ACCESS_KEY_ID`     | AWS access key |
| `EMAIL_SES_SECRET_ACCESS_KEY` | AWS secret key |
| `EMAIL_SES_REGION`            | AWS region     |

To generate an access/secret key pair, you can create an IAM user with the permission `AmazonSESFullAccess`. For more details, read the article [Creating an IAM user in your AWS account](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_console) on the AWS website.

## Usage

### Templates

To send a new email, you can use the `MailService`:

```ts
class ExampleService {
  constructor(private mailService: MailService) {}

  doSomething() {
    return this.mailService.send({
      to: 'Example User <user@example.com>',
      template: 'auth/password-reset',
      data: {
        name: 'Example User',
      },
    });
  }
}
```

In the above example, you are sending an email using the password reset template available at `src/templates/auth/password-reset.md`. Templates are written in Markdown and injected with variables using Mustache, and you can create as many as you like.

Note that the `send()` function is synchronous and adds your message to a queue (you do not neet to use `await`), and all messages are sequentially sent. Failed messages are retried, up to 3 times (you can configure this using the environment variable `EMAIL_FAIL_RETRIES`).

### Without templates

You can also directly send emails by specifying the `subject` and multiple formats, `html` and `text`.
