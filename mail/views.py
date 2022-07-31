import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import HttpResponse, HttpResponseRedirect, render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from functools import reduce
import operator
from .models import User, Email


def index(request):

    # Authenticated users view their inbox
    if request.user.is_authenticated:
        return render(request, "mail/inbox.html")

    # Everyone else is prompted to sign in
    else:
        return HttpResponseRedirect(reverse("login"))


@csrf_exempt
@login_required
def compose(request):

    # Composing a new email must be via POST
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)

    # Check recipient emails
    data = json.loads(request.body)
    emails = [email.strip() for email in data.get("recipients").split(",")]
    if emails == [""]:
        return JsonResponse({
            "error": "At least one recipient required."
        }, status=400)

    # Convert email addresses to users
    recipients = []
    for email in emails:
        try:
            user = User.objects.get(email=email)
            recipients.append(user)
        except User.DoesNotExist:
            return JsonResponse({
                "error": f"User with email {email} does not exist."
            }, status=400)

    # Get contents of email
    subject = data.get("subject", "")
    body = data.get("body", "")

    # Create one email for each recipient, plus sender
    users = set()
    users.add(request.user)
    users.update(recipients)
    for user in users:
        email = Email(
            user=user,
            sender=request.user,
            subject=subject,
            body=body,
            read=user == request.user
        )
        email.save()
        for recipient in recipients:
            email.recipients.add(recipient)
        email.save()

    return JsonResponse({"message": "Email sent successfully."}, status=201)


@login_required
def mailbox(request, mailbox):

    # Filter emails returned based on mailbox
    if mailbox == "inbox":
        emails = Email.objects.filter(
            user=request.user, recipients=request.user, archived=False, deleted=False,
        )
    elif mailbox == "sent":
        emails = Email.objects.filter(
            user=request.user, sender=request.user, deleted=False,
        )
    elif mailbox == "archive":
        emails = Email.objects.filter(
            user=request.user, archived=True, deleted=False,
        ).filter( Q(sender=request.user) |Q(recipients=request.user))
    elif mailbox == "starred":
        emails = Email.objects.filter(
            user=request.user, starred=True, deleted=False,
        ).filter( Q(sender=request.user) |Q(recipients=request.user))
    elif mailbox == "trash":
        emails = Email.objects.filter(
            user=request.user, deleted=True
        ).filter( Q(sender=request.user) |Q(recipients=request.user))
    
    else:
        return JsonResponse({"error": "Invalid mailbox."}, status=400)

    # Return emails in reverse chronologial order
    emails = emails.order_by("-timestamp").all()
    return JsonResponse([email.serialize() for email in emails], safe=False)


@csrf_exempt
@login_required
def email(request, email_id):

    # Query for requested email
    try:
        email = Email.objects.get(user=request.user, pk=email_id)
    except Email.DoesNotExist:
        return JsonResponse({"error": "Email not found."}, status=404)

    # Return email contents
    if request.method == "GET":
        return JsonResponse(email.serialize())

    # Update whether email is read or should be archived
    elif request.method == "PUT":
        data = json.loads(request.body)
        if data.get("read") is not None:
            email.read = data["read"]
        if data.get("archived") is not None:
            email.archived = data["archived"]
        if data.get("starred") is not None:
            email.starred = data["starred"]
        if data.get("deleted") is not None:
            email.deleted = data["deleted"]
        email.save()
        return HttpResponse(status=204)

    elif request.method == "DELETE":
        email.delete()
        return HttpResponse(status=204)
    # Email must be via GET or PUT
    else:
        return JsonResponse({
            "error": "GET or PUT or DELETE request required."
        }, status=400)

@csrf_exempt
@login_required
def search(request, query):
    if " " in query:
        queries = query.split(" ")
        qset1 =  reduce(operator.__or__, [Q(sender__email__icontains=query) | Q(sender__first_name__icontains=query) | Q(sender__last_name__icontains=query)  | Q(subject__icontains=query) | Q(body__icontains=query) for query in queries])
        results = Email.objects.filter(user=request.user).filter(qset1).distinct()
    else:
        results = Email.objects.filter(user=request.user)\
            .filter(Q(sender__email__icontains=query) 
            | Q(sender__first_name__icontains=query) 
            | Q(sender__last_name__icontains=query) 
            | Q(subject__icontains=query) 
            | Q(body__icontains=query)).distinct()
    if results:
        emails = results.order_by("-timestamp").all().distinct()
        return JsonResponse([email.serialize() for email in emails], safe=False)
    else:
        return JsonResponse({"error": "No result Found"}, status=404)


def login_view(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse("index"))
    if request.method == "POST":

        # Attempt to sign user in
        email = request.POST["email"]
        password = request.POST["password"]
        user = authenticate(request, username=email, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "mail/login.html", {
                "message": "Invalid email and/or password."
            })
    else:
        return render(request, "mail/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        email = request.POST["email"]
        first_name = request.POST["fname"]
        last_name = request.POST["lname"]
        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        
        if password != confirmation:
            return render(request, "mail/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username=email,email=email,password=password,first_name=first_name,last_name=last_name)
            user.save()
        except IntegrityError as e:
            print(e)
            return render(request, "mail/register.html", {
                "message": "Email address already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "mail/register.html")
