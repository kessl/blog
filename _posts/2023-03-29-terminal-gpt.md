---
title: GPT in terminal
tags:
  - GPT
---

One application of GPT I found useful in software development is generating and manipulating structured data with vague instructions.

For example: generate test fixtures

```bash
$ h generate sample yaml of 5 example users, not an array

user1:
  name: John Doe
  email: john.doe@example.com
  age: 35
  gender: male
  occupation: software engineer

user2:
  name: Jane Smith
  email: jane.smith@example.com
  age: 28
  gender: female
  occupation: graphic designer

user3:
  name: James Brown
  email: james.brown@example.com
  age: 42
  gender: male
  occupation: accountant

user4:
  name: Sarah Johnson
  email: sarah.johnson@example.com
  age: 31
  gender: female
  occupation: teacher

user5:
  name: Michael Lee
  email: michael.lee@example.com
  age: 25
  gender: male
  occupation: marketing specialist
```

Generate mock UI data:

```bash
$ h give me a json array of 10 randomly generated sales records with timestamp, amount, description and customer id, return data only > records.json
$ cat records.json
{
  "data": [
    {
      "timestamp": "2022-05-04 10:32:19",
      "amount": 135.78,
      "description": "Product A",
      "customer_id": "Cust_3456"
    },
    {
      "timestamp": "2022-04-30 14:20:55",
      "amount": 57.99,
      "description": "Product B",
      "customer_id": "Cust_2238"
    },
    {
      "timestamp": "2022-05-01 09:45:12",
      "amount": 89.99,
      "description": "Product C",
      "customer_id": "Cust_5789"
    },
    ...
  ]
}
```

Generate CSV:

```bash
$ h give me an example csv of 10 webpage visits with headers, return csv only > visits.csv
$ cat visits.csv
Timestamp,Page URL,Referrer,User Agent,IP Address
2021-06-01T09:00:00Z,https://www.example.com/,https://www.google.com/,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:05:00Z,https://www.example.com/page1,https://www.example.com/,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:10:00Z,https://www.example.com/page2,https://www.example.com/page1,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:15:00Z,https://www.example.com/page3,https://www.example.com/page2,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:20:00Z,https://www.example.com/page4,https://www.example.com/page3,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:25:00Z,https://www.example.com/page5,https://www.example.com/page4,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:30:00Z,https://www.example.com/page6,https://www.example.com/page5,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:35:00Z,https://www.example.com/page7,https://www.example.com/page6,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:40:00Z,https://www.example.com/page8,https://www.example.com/page7,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
2021-06-01T09:45:00Z,https://www.example.com/page9,https://www.example.com/page8,Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36,192.168.0.1
```

GPT can also perform ad-hoc data analyses and transformations, althought sometimes it takes a few prompts:

```
$ h translate user agent strings to browser names with versions in the following csv dataset: $(cat visits.csv)
Timestamp, Page URL, Referrer, User Agent, IP Address
2021-06-01T09:00:00Z, https://www.example.com/, https://www.google.com/, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:05:00Z, https://www.example.com/page1, https://www.example.com/, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:10:00Z, https://www.example.com/page2, https://www.example.com/page1, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:15:00Z, https://www.example.com/page3, https://www.example.com/page2, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:20:00Z, https://www.example.com/page4, https://www.example.com/page3, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:25:00Z, https://www.example.com/page5, https://www.example.com/page4, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:30:00Z, https://www.example.com/page6, https://www.example.com/page5, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:35:00Z, https://www.example.com/page7, https://www.example.com/page6, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:40:00Z, https://www.example.com/page8, https://www.example.com/page7, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
2021-06-01T09:45:00Z, https://www.example.com/page9, https://www.example.com/page8, Chrome 91.0.4472.77 (Windows 10), 192.168.0.1
```

---

`h` is a bash function inspired by [this blog post](https://kadekillary.work/posts/1000x-eng/).
You'll need to [obtain an API token](https://platform.openai.com/loggedout) first.
You can change `model` to `gpt-4` instead of `gpt-3.5-turbo` if you have access.

```bash
function ask_gpt() {
    curl https://api.openai.com/v1/chat/completions -s \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $OPENAPI_TOKEN" \
      -d "$(jq -c -n --arg content "$*" '{model:"gpt-3.5-turbo",messages:[{role:"user",$content}],temperature:0.7}')" \
    | jq -r '.choices[0].message.content // .error.message'
}

alias h="ask_gpt"
```
