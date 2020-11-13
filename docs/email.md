# Email

Staart API supports sending transactions emails. You can send emails using any SMTP provider or [nodemailer/nodemailer](https://github.com/nodemailer/nodemailer)-supported configuration, such as AWS SES or `sendmail`.

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
