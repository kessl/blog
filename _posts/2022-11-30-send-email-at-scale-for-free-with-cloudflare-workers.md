---
title: Send email at scale for free with Cloudflare workers
tags:
  - devops
---
I was looking for a cheap/free way to send email for a hobby project.
At first I turned to Amazon SES, but after I tried to enable production access and received an extremely generic rejection, I got discouraged and put the project on hold.
Recently I discovered an interesting way to [send email for free using Cloudflare workers and MailChannels API](https://blog.cloudflare.com/sending-email-from-workers-with-mailchannels/).

The only requirement to use this is to have a domain name verified in Cloudflare.
MailChannels API is able to authorize requests coming from workers based on Cloudflare verification.
No accounts other than Cloudflare are needed.

## The worker

The worker receives a JSON payload representing a single email and forwards it to the MailChannels API.
Deploy it and configure `TOKEN` and optionally `DKIM_PRIVATE_KEY` (see below) in worker settings.

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not supported', { status: 405 })
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    if (token !== env.TOKEN) {
      return new Response('Unauthorized', { status: 403 })
    }

    const body = await request.json()
    const email_body = {
      personalizations: [{
        to: body.to,
        // dkim_domain: 'example.com',
        // dkim_selector: 'mail1',
        // dkim_private_key: env.DKIM_PRIVATE_KEY,
      }],
      from: body.from,
      subject: body.subject,
      content: body.content,
      // headers: {
      //   'List-Unsubscribe': '<mailto:daniel@example.com?subject=unsubscribe>',
      // },
    }

    const email_request = new Request('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(email_body),
    })
    const res = await fetch(email_request)
    return new Response(`${res.status} ${res.statusText}`, { status: res.status })
  },
}
```

![Worker environment settings](/assets/images/mailchannels-worker-env.png)

To test it, deploy the worker and call it in production.
*Requests sent through Cloudflare's Quick edit interface would not work with MailChannels* when I wrote this article.
MailChannels API will return `403` if the worker is called through Quick edit.

```bash
TOKEN=<token from worker env>
WORKER_URL=<URL of deployed worker>
curl -H 'application/json' -H "Authorization: Bearer $TOKEN" -d "{\"to\":[{\"email\":\"test@example.com\"}],\"from\":[{\"email\":\"sender@example.com\"}],\"subject\":\"Test subject\",\"content\":[{\"type\":\"text/plain\",\"value\":\"Test email\\r\\n\"}]}" $WORKER_URL
```

## Deliverability tuning

It's a good idea to configure SPF, DKIM, DMARC and an MX record to prevent emails getting caught in spam filters.
SPF, DMARC and receiving emails (I used Cloudflare Email Routing) are configured through DNS records.

### DKIM

Generate a DKIM private key and DNS record:

```bash
openssl genrsa 2048 | tee private_key.pem | openssl rsa -outform der | openssl base64 -A > private_key.txt
echo -n "v=DKIM1;p=" > dkim_record.txt && openssl rsa -in private_key.pem -pubout -outform der | openssl base64 -A >> dkim_record.txt
```

Save private key in `DKIM_PRIVATE_KEY` worker environment variable.
Configure DKIM record with the right selector in Cloudflare DNS and uncomment DKIM config in the worker:

```javascript
dkim_domain: 'example.com',
dkim_selector: 'mail1',
dkim_private_key: env.DKIM_PRIVATE_KEY,
```

### List-Unsubscribe header

The List-Unsubscribe header should be present in mass emails (emails that are not transactional).
Email clients that support it will show the user an unsubscribe button.
Configure it in email headers like this:

```javascript
headers: {
  'List-Unsubscribe': '<mailto:daniel@example.com?subject=unsubscribe>',
},
```

[Mail tester](https://www.mail-tester.com/) is useful for testing deliverability. You can test ~5 emails per day for free.

![Screenshot of 10/10 spam test result](/assets/images/workers-email-spam-test-result.png)

## Sending emails from Rails

To send emails from Rails using ActionMailer, add a delivery method that calls the worker:

`lib/mailchannels_integration/worker_delivery_method.rb`:
```ruby
module MailchannelsIntegration
  class WorkerDeliveryMethod
    WORKER_EP = '<worker URL>'.freeze

    attr_accessor :settings

    class WorkerDeliveryError < StandardError; end

    def initialize(settings)
      self.settings = settings
    end

    def deliver!(mail)
      Rails.logger.info('[MailChannels] Attempting to send email')
      res = Typhoeus.post(WORKER_EP, { headers: headers, body: body(mail) })
      raise WorkerDeliveryError, res.body unless res.success?
      Rails.logger.info('[MailChannels] Email sent')
    end

    def headers
      token = Rails.application.credentials.dig(:mailchannels_worker, :token)
      {
        Authorization: "Bearer #{token}",
        'Content-Type': 'application/json',
      }
    end

    def body(mail)
      {
        to: mail.to.map { |email| { email: email} },
        from: { email: mail.from.first },
        subject: mail.subject,
        content: [{ type: 'text/plain', value: mail.body.raw_source }],
      }.to_json
    end
  end
end
```

`credentials.yml`:
```yaml
mailchannels_worker:
  token: <token from worker env>
```

`config/application.rb`:
```ruby
require "mailchannels_integration/worker_delivery_method"
ActionMailer::Base.add_delivery_method :mailchannels_worker, MailchannelsIntegration::WorkerDeliveryMethod
```

`config/environments/(development|production).rb`
```ruby
config.action_mailer.raise_delivery_errors = true
config.action_mailer.delivery_method = :mailchannels_worker
```

With this configuration, you can send emails as usual using `mail()`.

## Scaling

As far as I know, MailChannels imposes no limits on how many emails you can send this way.
Cloudflare workers are free up to 100k requests per day and limited to 10ms of execution time per invocation.
You could batch emails before calling the worker to squeeze out a few extra emails before having to upgrade.

## Useful links

- [MailChannels Cloudflare integration docs](https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413-Sending-Email-from-Cloudflare-Workers-using-MailChannels-Send-API)
- [MailChannels API docs](https://api.mailchannels.net/tx/v1/documentation)
- [MailChannels Cloudflare Pages plugin](https://developers.cloudflare.com/pages/platform/functions/plugins/mailchannels/) for simple contact forms for static pages
