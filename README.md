<div align="center">



# Gmail Clone

  [![YouTube](https://img.shields.io/badge/YouTube-%23FF0000.svg?style=for-the-badge&logo=YouTube&logoColor=white)](https://www.youtube.com/embed/ZYKOReUFKtE)  [![Render](https://img.shields.io/badge/Render-%46E3B7.svg?style=for-the-badge&logo=render&logoColor=white)](https://gmail-b32w.onrender.com)



</div>


[![Multi-device](/images/multi-device.png)](https://www.youtube.com/embed/ZYKOReUFKtE)

A single-page-app email client that makes API calls to send and receive emails with  front-end similar to Gmail. 


## Table of contents

- [Gmail Clone](#gmail-clone)
  - [Table of contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Overview](#overview)
    - [Features](#features)
    - [Screenshot](#screenshot)
    - [Links](#links)
  - [My process](#my-process)
    - [Built with](#built-with)
    - [What I learned](#what-i-learned)
    - [Continued development](#continued-development)
    - [Achievements](#achievements)
    - [Useful resources](#useful-resources)
  - [Author](#author)
  - [Acknowledgments](#acknowledgments)


## Getting Started

### Prerequisites
After cloning the repo you need to create a Virtual environment and activate it.

First install virtualenv package 

```bash
pip install virtualenv
```
Open cli in the folder of the cloned repo and then create env
```bash
virtualenv env
```
To activate the env (For windows, For other OS you can easily google)
```bash
env\Scripts\activate
```

### Installation
Install the dependencies from the requirements.txt file
```bash
cd mail
pip install -r requirements.txt
```
Start the django server
```bash
python manage.py runserver
```
Now you can access the project at http://127.0.0.1:8000
## Overview

### Features

- **Send Mail** - User is able to send mails passing in values for recipients, subject, and body.
- **Mailbox** -  The appropriate mailbox is loaded on visiting the Inbox, Sent, Archive, Starred or Trash mailbox.
- **View Email** - When a user clicks on an email, the user is taken to a view where they see the content of that email.
- **Archive and Unarchive** -  Users are able to archive and unarchive emails.
- **Reply** - Users are able to reply to emails received and even forward them.
- **Search** - Users can search emails based on any keyword present in their email description or usernames.
- **History Api** - Enables page navigation and routing in pure vanilla JavaScript through powerful set of methods for SPAs. 
- **CkEditor** - Povides user with a WYSIWYG to write custom with styling and images emails. 
- **Mobile responsive** - UI not only adapts to the screen size but changes accordingly to match with actual Gmail UI.


### Screenshot

![Multi-device](/images/6%20Iphone.jpg)


### Links

- Live Site URL: [Deployed on Render](https://gmail-b32w.onrender.com)

## My process

### Built with
- [Django](https://www.djangoproject.com/) - High-level Python web framework
- [CKEditor](https://ckeditor.com/) - JavaScript rich text editor (WYSIWYG)
- Bootstrap
- Javascript
- Semantic HTML5 markup
- CSS custom properties
- Flexbox
- Media queries


### What I learned

I am using this section to recap over some of my major learnings while working through this project. I feel writing these out and providing code samples of areas I want to highlight is a great way to reinforce my own knowledge.

- **Q Objects**
  To execute more complex queries with django ORM (for example, queries with OR statements) you need to use Q objects. I used them at multiple places in my views and they make up my simple search feature work.
  
  ```python
  # My simple search query 
  # Here Q with | works similar to LIKE OR query of SQL
  #Note: __contains __(case-sensitive) and icontains (case-insensitive)
  results = Email.objects.filter(user=request.user)\
    .filter(Q(sender__email__icontains=query)
    | Q(sender__first_name__icontains=query)
    | Q(sender__last_name__icontains=query)
    | Q(subject__icontains=query)
    | Q(body__icontains=query)).distinct()
  ```
- **JsonResponse**
  JsonResponse is an HttpResponse subclass that helps to create a JSON-encoded response. Based on my usecase it enabled me to make a simple API with a serializer inside my model that returns the data in required JSON format.
  ```python
  # views.py
  def mailbox(request, mailbox):
    #skipped some code here
    return JsonResponse([email.serialize() for email in emails], safe=False)

  #models.py
  class Email(models.Model):
    #skipped some code here
    def serialize(self):
        return {
            "id": self.id,
            "username": self.sender.first_name +" "+self.sender.last_name,
            "sender": self.sender.email,
            "recipients": [user.first_name +" "+user.last_name for user in self.recipients.all()],
            "subject": self.subject,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d-%Y-%H:%M %p" ),
            "read": self.read,
            "archived": self.archived,
            "starred": self.starred,
            "deleted": self.deleted,
        }
  ```
- **History Api**
  Single page applications do not re-render pages rather they make changes to the page asynchronously. While this feature looks appealing to the user the state of the website is no longer saved by the browser as it is done with multi-page websites. So inorder to make the back and forward history buttons of the browser the history API is used.

  To use the browser’s history functionality, you begin by telling the browser to remember your initial state. This requires the replaceState method
  ```js
  // Initial State
  // To use the browser’s history functionality, 
  // you begin by telling the browser to remember your initial state.
  history.replaceState({ mailbox: "inbox" }, "Default state", "#inbox"); 

  //Behind the scenes, The History Api uses a Stack data structure.

  //Pushstate pushes states to the stack
  history.pushState({ mailbox: mailbox }, "", `./#${mailbox}`);

  //Popstate pop states out of the stack
  window.addEventListener("popstate", (e) => {
        load_mailbox(e.state.mailbox); //Popstate
    }
  ```


### Continued development

I am using this section to outline areas that I want to continue focusing on in future for this project. 

**Tasks To Do**
- [X] Loading Spinners
- [ ] ML model to detect spam mails
- [ ] Pagination + Infinite Scroll 
- [ ] Code Refactoring

### Achievements
- My teacher and CSS Expert kevin powell by whom I learned responsive design reviewed the design of my gmail clone and he loved it.
- [Link to the video](https://youtu.be/3FU-pY5BzKs)

### Useful resources
- [Q object docs](https://docs.djangoproject.com/en/4.0/topics/db/queries/#complex-lookups-with-q-objects) - This is the django doc i reffered for understanding Q objects.
- [History Api](https://medium.com/@george.norberg/history-api-getting-started-36bfc82ddefc) - This is an amazing article which helped me finally understand History Api. I'd recommend it to anyone still learning this concept.


## Author

- Profile - [Hussain Shaikh](https://www.linkedin.com/in/hussainshk/)
- Twitter - [@HussainSk2001](https://twitter.com/HussainSk2001)


## Acknowledgments

- **[CS50](https://cs50.harvard.edu/web/2020) and [Brian Yu](https://brianyu.me/)** - I am absolutely thankfull to them as they enabled me to learn such amazing concepts free of cost and gave me an headstart in web development. I would recommend it anybody who wants to become a web dev.
- **[Kevin Powell](https://www.youtube.com/kepowob)** - His course [conquering responsive layouts](https://courses.kevinpowell.co/conquering-responsive-layouts) gave me the weapons to tackle one of the toughest things in web development, CSS!!.

