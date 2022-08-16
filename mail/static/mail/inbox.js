const user_email = JSON.parse(
  document.getElementById("user_email").textContent
);
const user_firstn = JSON.parse(
  document.getElementById("first_name").textContent
);
const user_lastn = JSON.parse(document.getElementById("last_name").textContent);
document.addEventListener("DOMContentLoaded", function () {
  history.replaceState({ mailbox: "inbox" }, "Default state", "#inbox"); //default state
  window.addEventListener("popstate", (e) => {
    // console.log(e.state);
    if(e.state.query){
      load_mailbox("search" ,e.state.query);
    }
    else if(e.state.email) {
      let doc = new DOMParser().parseFromString(e.state.element, 'text/html');
      veiw_email(e.state.email,doc, e.state.mail);
    }
    else if(e.state.mailbox !== null) {
      if (e.state.mailbox !== "compose") {
        load_mailbox(e.state.mailbox);
      } else {
        compose_email();
      }
    }
    // if(e.state.){
    //   load_mailbox(e.state.mailbox);
    // }
  });
  // Sidebar toggler
  $("#sidebarCollapse").on("click", function () {
    $("#sidebar").toggleClass("side_active");
    $(".main").toggleClass("spread");
    // show overlay when menu appears on mobile devices
    if ($(window).width() <= 768) {
      $(".overlay").addClass("over_active");
    }
  });

  // hide overlay when it is clicked
  $(".overlay").on("click", function () {
    // hide sidebar
    $("#sidebar").removeClass("side_active");
    // hide overlay
    $(".overlay").removeClass("over_active");
  });

  window.addEventListener('resize', function(event){
    if ($(window).width() > 768) {
      if($(".main").hasClass("spread")){
        $("#sidebar").addClass("side_active");
      }
      document.querySelector('.navbar').style.display = "flex";
      
    }
    if ($(window).width() <= 768){
      if($("#sidebar").hasClass("side_active")){
        $(".overlay").addClass("over_active");
      }
      else{
        $(".overlay").removeClass("over_active");
      }
    }
  });

  // Active Nav-links style
  $(".nav-link").each(function () {
    var link = this;
    // console.log($(".mailbox_head").text)
    // if the current path is like this link, make it active
    link.addEventListener("click", function () {
      let maildiv;
      
      if(document.querySelector("#emails-view").style.display !== "none"){
        maildiv = document.querySelector(".mailbox_head").textContent;
        if( maildiv.toLowerCase() !== link.id){
          // console.log(maildiv)
          history.pushState({ mailbox: link.id }, "", `./#${link.id}`);
          if(link.id !== "compose") load_mailbox(link.id);
        }
      }
      else{
        history.pushState({ mailbox: link.id }, "", `./#${link.id}`);
          if(link.id !== "compose") load_mailbox(link.id);
      }
     
    });
  });

  // Avatar based on Username
  let avatars = document.querySelectorAll(".user-icon");
  avatars.forEach((avatar) => {
    avatar.style.backgroundColor = calculateColor(user_email);
    avatar.innerHTML = user_firstn.charAt(0).toUpperCase();
  });

  // search bar
  document.querySelector(".srch-form").addEventListener("submit", (e) => {
    let srch_query = document.querySelector(".srch-inp").value;
    // console.log(srch_query);
    if (srch_query.trim().length > 0) {
      history.pushState({ query: srch_query.trim() }, "", `./#search/${srch_query.trim()}`);
      load_mailbox("search", srch_query.trim());
    }
    e.preventDefault();
  });

  document.querySelector("#compose").addEventListener("click", () => {
    if(document.querySelector("#compose-view").style.display === "none"){
      compose_email()
    }
  });
  // history.pushState({compose : }, "", `./#${link.id}`)
  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email(email = null, status="") {
  tog_menu(); // toggle sidebar when on mobile devices
  if($(window).width() <= 768){
    document.querySelector('.navbar').style.display = "flex";
  }
  if (document.querySelector("#compose-view").style.display === "none") {
    // create new instance of balloonEditor
    BalloonEditor.create(document.querySelector("#compose-body"))
      .then((editor) => {
        // console.log( editor );
        editor.setData("");
        if (email !== null && status === "reply") {
          editor.setData(
            `<p> On ${email.timestamp} ${email.sender} wrote: </p> ${email.body}`
          );
        }
        else if (email !== null && status === "forward") {
          editor.setData(
            `<p>---------- Forwarded message ---------</p>
            <p>From: <strong>${email.username}</strong> <span class="detail-small d-none d-lg-inline"><span><</span>${email.sender}></span> </p>
            <p>Date: ${email.timestamp}</p>
            <p>Subject: ${email.subject}</p> 
            <p>To: ${email.recipients}</p> 
            ${email.body}`
          );
        }
        document.querySelector("#compose").addEventListener("click", () => {
          editor.setData("");
        });
        // destroy editor instance if the compose view is not visible
        let targetNode = document.querySelector("#compose-view");
        let observer = new MutationObserver(function () {
          if (targetNode.style.display == "none") {
            editor.destroy();
          }
        });
        observer.observe(targetNode, { attributes: true });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#check-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#title").textContent = "New Mail";
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").innerHTML = "";

  if (email !== null && status === "reply") {
    document.querySelector("#title").textContent = "Reply";
    document.querySelector("#compose-recipients").value = email.sender;
    document.querySelector("#compose-subject").value = email.subject.startsWith(
      "Re:"
    )
      ? email.subject
      : `Re: ${email.subject}`;
    //
    // document.querySelector("#compose-body").innerHTML = `<p> On ${email.timestamp} ${email.sender} wrote: </p> ${email.body}`;
  }

  else if (email !== null && status === "forward") {
    document.querySelector("#title").textContent = "Forward";
    document.querySelector("#compose-recipients").focus();
    document.querySelector("#compose-subject").value = email.subject.startsWith(
      "Fwd:"
    )
      ? email.subject
      : `Fwd: ${email.subject}`;
    //
    // document.querySelector("#compose-body").innerHTML = `<p> On ${email.timestamp} ${email.sender} wrote: </p> ${email.body}`;
  }

  document.querySelector("#compose-form").onsubmit = () => {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    let body = document.querySelector("#compose-body").innerHTML;
    // console.log(body)

    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        // Print result
        // console.log(result);
        custm_alert(result);
      });

    return false;
  };
}

function load_mailbox(mailbox, query = "") {
  tog_menu();

  if(mailbox !== "search"){
    $(".nav-link").each(function () {
      // console.log(this.id);
      $(this).removeClass("active");
    });
    $(`#${mailbox}`).addClass("active");
  }
  
  // Show the mailbox and hide other views
  if($(window).width() <= 768){
    document.querySelector('.navbar').style.display = "flex";
  }
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#check-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  // console.log(mailbox);
  spinner = `
  <div class="d-flex justify-content-center spin my-5">
    <div class="spinner-border text-danger" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>`;

  document.querySelector(
    "#emails-view"
  ).innerHTML = `<h4 class="mailbox_head py-2 pl-3 m-0 mx-1">${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h4> ${spinner}`;

  // console.log(mailbox);
  if (mailbox === "search") {
    mailbox = `search/${query}`;
  }
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      $(".spin").removeClass("d-flex").addClass("d-none");
      // Print emails
      // console.log(emails);
      if (emails.error) {
        document.querySelector(
          "#emails-view"
        ).innerHTML += `<h5 class="pl-3 pt-2">${emails.error} for "${query}"</h5>`;
      }
      else if(emails.length > 0){
        // ... do something else with emails ...
      emails.forEach((email) => {
        const element = document.createElement("div");
        element.classList.add(
          "row",
          "my-0",
          "mx-1",
          "single-mail"
        );
        element.style.cursor = "pointer";
        element.innerHTML = `
        ${(() => {
          // let  archive_btn =

          let sender = email.username;
          let user_avatar = `<div class="user-icon-wrapper" >
                             <span class="singlemail-user-icon rounded-circle text-white" style="background-color:${calculateColor(
                               email.sender
                             )}">${sender.charAt(0).toUpperCase()}</span>
                            </div>`;
          let sendto = email.recipients;
          if (sendto.includes(sender)) {
            let index = sendto.indexOf(email.username);
            sendto[index] = "me";
            sender = "me";
          }
          if(user_email === email.sender){
            sender = "me";
          }
          if (mailbox === "sent") {
            sender = `To: ${sendto}`;
          }

          let archive_stat = email.archived ? "Unarchive" : "Archive";
          let star_stat = email.starred ? "Starred" : "Not starred"
          let del_stat = email.deleted ? "Restore" : "Delete"

          let mark_read_stat = "Mark as Unread";
          if (!email.read) {
            mark_read_stat = "Mark as Read";
            element.classList.add("unread");
          } else {
            element.classList.add("light");
            element.classList.remove("unread");
          }

          let archive_slash = email.archived
            ? `<i class="fas fa-slash"></i>`
            : "";
          let mark_class = email.read ? "fa-envelope-open" : "fa-envelope";
          let star_class = email.starred ? "fas" : "far";
          let del_class = email.deleted ? "fa-recycle" : "fa-trash";
          let del_forever = mailbox === "trash" ?`<li class="btn-item del_forever" data-toggle="tooltip" data-placement="bottom" title="Delete forever"><i class="fas fa-trash"></i></li>   ` :"";
          let ext_btn = mailbox === "trash" ? "ext_btn": "";
          return `
            ${user_avatar}
            <div class="star-wrapper"  data-toggle="tooltip" data-placement="bottom" title="${star_stat}">
              <span class="star"> <i class="${star_class} fa-star"></i> </span>
            </div>
            <div class="sender">${sender}</div>
            <div class="subject text-left">
              <div class="d-inline">${
                email.subject.length > 0 ? email.subject : "(no subject)"
              }</div>
            <span class="text-muted font-weight-normal">${email.body.replace(
              /<(.|\n)*?>/gi,
              " "
            )}</span></div>
            <div class="timestamp ${ext_btn}">
            <span id="time">${readable_date(email.timestamp)}</span>
            <ul class="btn-list">
                <li class="btn-item archive" id="archive" data-toggle="tooltip" data-placement="bottom" title="${archive_stat}" >${archive_slash}</li>
                <li class="btn-item mark-read" data-toggle="tooltip" data-placement="bottom" title="${mark_read_stat}"><i class="fas ${mark_class}"></i></li>
                <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                ${del_forever}
            </ul>
            </div>
            `;
        })()}`;
        element.addEventListener(
          "click",
          (e) => {
            fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({
                read: true,
              }),
            });
            history.pushState(
              { email: email.id ,
                element : element.innerHTML,
                mail: mailbox },
              "",
              `#${mailbox}/${email.id}`
            );
            // console.log(email.id);
            veiw_email(email.id, element, mailbox);

            e.stopImmediatePropagation();
          },
          false
        );

        mark_read(email, element, mailbox);
        mark_archive(email, element, mailbox);
        mark_star(email, element, mailbox);
        mark_del(email, element, mailbox);
        if(mailbox === "trash"){
          element.querySelector(".del_forever").addEventListener("click", (e)=>{
            fetch(`/emails/${email.id}`, {
              method: "DELETE",
            });
            custm_alert("Conversation deleted forever")
            hide_element(element);
            e.stopImmediatePropagation();
          })
        }
        if ($(window).width() >= 768) {
          element.addEventListener(
            "mouseover",
            () => {
              element.classList.add("shadow", "mail");
              element.querySelector(":scope > div > #time").style.display =
                "none";
              element.querySelector(
                ":scope > div > .btn-list"
              ).style.visibility = "visible";
            },
            false
          );

          element.addEventListener(
            "mouseout",
            () => {
              element.classList.remove("shadow", "mail");
              // $('[data-toggle="tooltip"]').tooltip('hide');
              element.querySelector(
                ":scope > div > .btn-list"
              ).style.visibility = "hidden";
              element.querySelector(":scope > div > #time").style.display =
                "block";
            },
            false
          );
        }
        document.querySelector("#emails-view").append(element);
      });
      }
      else{
        const empty = document.createElement("div");
        empty.classList.add(
          // "row",
          "d-flex",
          "flex-column",
          "mt-5",
        );
        empty.innerHTML = `
        <div class="text-center empty_icon"><i class="far fa-folder-open"></i></div>
        <div class="text-center empty_text">Nothing in ${mailbox}</div>`
        document.querySelector("#emails-view").append(empty);
    }
      $('[data-toggle="tooltip"]').tooltip();
    })
    .catch((error) => {
      console.log(error);
    });
}

function mark_archive(email, element, mailbox) {
  element.querySelector("#archive").addEventListener(
    "click",
    (e) => {
      if (mailbox !== "archive" && mailbox !== "trash" ) {
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: true,
          }),
        });
        custm_alert("Conversation archived")
        // element.querySelector(":scope > #archive").classList.remove('archive')
        // element.querySelector(":scope > #archive").classList.add('unarchive')
      } else if (mailbox === "archive") {
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: false,
          }),
        });
        custm_alert("Conversation moved to inbox")
      }
      $(element.querySelector("#archive")).tooltip("hide");
      if(mailbox !== "trash"){
        hide_element(element);
      }
      e.stopImmediatePropagation();
    },
    false
  );
}
function mark_read(email, element, mailbox) {
  element.querySelector(".mark-read").addEventListener(
    "click",
    (e) => {
      let read = element.querySelector(":scope .mark-read > i");
      if (read.classList.contains("fa-envelope-open")) {
        read.classList.remove("fa-envelope-open"),
          read.classList.add("fa-envelope"),
          $(element.querySelector(".mark-read"))
            .attr("data-original-title", "Mark as read")
            .tooltip("show");

        element.classList.add("unread");
        // element.disabled = "disabled";
        element.classList.remove("light");

        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: false,
          }),
        });
      } else {
        read.classList.remove("fa-envelope"),
          read.classList.add("fa-envelope-open"),
          $(element.querySelector(".mark-read"))
            .attr("data-original-title", "Mark as unread")
            .tooltip("show");

        element.classList.add("light");
        element.classList.remove("unread");

        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }

      e.stopImmediatePropagation();
      $('[data-toggle="tooltip"]').tooltip();
    },
    false
  );
}

function mark_star(email, element, mailbox) {
  element.querySelector(".star-wrapper").addEventListener("click", (e) => {
    let star = element.querySelector(".fa-star");
    if (star.classList.contains("fas")) {
      star.classList.remove("fas"),
        star.classList.add("far"),
        $(element.querySelector(".star-wrapper"))
          .attr("data-original-title", "Not starred")
          .tooltip("show");

      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          starred: false,
        }),
      });
      if (mailbox === "starred") {
        $(element.querySelector(".star-wrapper")).tooltip("hide");
        hide_element(element);
      }
    } else {
      star.classList.add("fas"),
        $(element.querySelector(".star-wrapper"))
          .attr("data-original-title", "Starred")
          .tooltip("show");
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          starred: true,
        }),
      });
    }

    e.stopImmediatePropagation();
    $('[data-toggle="tooltip"]').tooltip();
  });
}

function mark_del(email, element, mailbox) {
      element.querySelector(".delete").addEventListener("click", (e) => {
        if(mailbox !== "trash"){
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              deleted: true,
            }),
          });
          $(element.querySelector(".delete")).tooltip("hide");
          custm_alert("Conversation moved to trash")
        }
      else{
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            deleted: false,
          }),
        });
        $(element.querySelector(".delete")).tooltip("hide");
        custm_alert("Conversation restored from trash")
      }
      hide_element(element);
      e.stopImmediatePropagation();
    });
}

function veiw_email(email_id, element, mailbox) {

  document.querySelector('.navbar').style.display = $(window).width() <= 768 ? "none" :"flex";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  // console.log(id);
  fetch(`/emails/${email_id}`)
    .then((response) => response.json())
    .then((email) => {
      if(email.error){
        custm_alert(email.error)
        load_mailbox(mailbox)
      }
      else{
        document.querySelector("#check-email").style.display = "block";
        let read = element.querySelector(".mark-read > i");
  // console.log(read)
  if(read.classList.contains("fa-envelope")){
    read.classList.remove("fa-envelope"),
      read.classList.add("fa-envelope-open"),
      $(element.querySelector("#check-email .mark-read"))
        .attr("data-original-title", "Mark as unread")
  }
  let star_title = email.starred ? "Starred": "Not Starred"
  let star_class = email.starred ? "fas" : "far";
  let sender = email.username;
  let user_avatar = `<div class="sing-icon-wrapper" >
                     <span class="sing-icon rounded-circle text-white" style="background-color:${calculateColor(
                       email.sender
                     )}">${sender.charAt(0).toUpperCase()}</span>
                    </div>`;
  let sendto = email.recipients.slice(0);
  // console.log(email.recipients)
  let subject =  email.subject.length > 0 ? email.subject : "(no subject)"
  if (sendto.includes(sender)) {
    let index = sendto.indexOf(email.username);
    sendto[index] = "me";
  }
  // console.log(email.recipients)
  let btn_list = element.querySelector(".btn-list").innerHTML 
  // console.log(btn_list)
      document.querySelector("#check-email").innerHTML = `
        <div class="px-md-4 px-sm-0">
         <div class="action_bar bg-white">
           <span class="btn-item back-btn"><i class="fas fa-arrow-left"></i></span>  
           <ul class="view-mail-btn-list">
           ${btn_list}
          </ul>         
         </div>
        
          <div class="row mx-auto">
            <h4 class="sing-sub">${
             subject
            }</h4>
          </div>

          <div class="sing-detail">
          ${user_avatar}
            <div class="sing-username-wrapper">
            	<div class="sing-username">
            	  <p class="d-inline-block text-truncate p-0 m-0"><strong>${sender}</strong>  <span class="detail-small d-none d-lg-inline"><span><</span>${email.sender}></span> </p>
            	</div>
            
            	<div class="dropdown">
            	 <a class="dropdown-toggle text-muted h6 text-decoration-none detail-small tome" href="#" id="dropdownMenuButton" data-toggle="dropdown" data-display="static" >to ${sendto}</a>
                <div class="dropdown-menu dropdown-menu-right dropdown-menu-md-left shadow dropdown-tome" aria-labelledby="dropdownMenu2" style="top: 1rem;">
                <table class="table table-borderless my-2 detail-small">
                  <tbody>
                    <tr class="py-0">
                      <td class="text-muted text-right">From:</td>
                      <td><span class="font-weight-bold">${email.username}</span> . ${email.sender}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">To:</td>
                      <td>${email.recipients}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Date:</td>
                      <td>${email.timestamp}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Subject:</td>
                      <td>${subject}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
 
            <div class="sing-timestamp">
              <p class="detail-small d-inline time">${$(window).width() <= 768 ? readable_date(email.timestamp) : email.timestamp}</p>
            </div>
         
            <div class="timestamp-icons pl-2">
              <span class="st" data-toggle="tooltip" data-placement="bottom" title="${star_title}" style="cursor:pointer"> <i class="${star_class} fa-star"></i> </span>
              <span data-toggle="tooltip" data-placement="bottom" title="Reply"><i class="fas fa-reply pl-3 replybtn" ></i></span>
          </div>
          </div>
          
          <div class="row-fluid sing-body my-3">
            <div class="p-0">${email.body}</div>
            
          </div>
          
          <div class="row mx-auto reply-btn">
            <button class="btn btn-light border my-3 mb-4 px-4 replybtn" id="reply" ><i class="fas fa-reply pr-3"></i>Reply</button>
            <button class="btn btn-light border my-3 mb-4 px-4 ml-3" id="forward" ><i class="fas fa-arrow-right pr-3"></i>Forward</button>
          </div>
          
        </div> 
      `;
      let btn_items = document.querySelectorAll("#check-email .btn-item")
      btn_items.forEach((btn_item) => {
        btn_item.addEventListener("click", () => {
          if(mailbox.startsWith("search")){
            let [,query] = mailbox.split("/")
            history.pushState({ query: query }, "", `./#search/${query}`);
          }
          history.pushState({ mailbox: mailbox }, "", `./#${mailbox}`);
 
        if(btn_item.classList.contains("archive")) {
          // mark_archive(email,element,mailbox)
           
          $(element.querySelector("#archive")).click()
            // hide_element(element);           
        }

        else if(btn_item.classList.contains("mark-read"))
        {
          // load_mailbox(mailbox)
          $(element.querySelector(".mark-read")).click()
          $(element.querySelector(".mark-read")).tooltip('hide')
          // setTimeout(() => { load_mailbox(mailbox)   }, 100);
        }
        
        else if(btn_item.classList.contains("delete")){
          $(element.querySelector(".delete")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        else if(btn_item.classList.contains("del_forever")){
          $(element.querySelector(".del_forever")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        let url = window.location.hash
        if(url.startsWith("#search")){
          let [,query] = url.split('/')
          setTimeout(() => { load_mailbox("search",query)   }, 300);
        }
        else{
          setTimeout(() => { load_mailbox(mailbox)   }, 300);
        }
        })
      })
      document.querySelector(".st").addEventListener("click" , (e) =>{
        let star = document.querySelector(".st .fa-star");
        if (star.classList.contains("fas")) {
          star.classList.remove("fas"),
            star.classList.add("far"),
            $( document.querySelector(".st"))
              .attr("data-original-title", "Not starred")
              .tooltip("show");
    
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              starred: false,
            }),
          });
         
        } else {
          star.classList.add("fas"),
            $(document.querySelector(".st"))
              .attr("data-original-title", "Starred")
              .tooltip("show");
          fetch(`/emails/${email.id}`, {
            method: "PUT",
            body: JSON.stringify({
              starred: true,
            }),
          });
        }
    
        // e.stopImmediatePropagation();
      });
      let replybtns =  document.querySelectorAll(".replybtn")
      replybtns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          compose_email(email, "reply");
          e.stopImmediatePropagation();
        });
      })
      document.querySelector("#forward").addEventListener("click", (e)=>{
        compose_email(email, "forward");
          e.stopImmediatePropagation();
      })
      $('[data-toggle="tooltip"]').tooltip();
 
      }
    });
     //   // ... do something else with email ...
    // });
}


function custm_alert(val) {
  // $("#myToast").toast("hide");
  toastHead = document.querySelector("#head");
  toast = document.querySelector("#myToast");
  toast.classList.remove('hideToast')
  if (val.error) {
    toastHead.innerHTML = val.error;
  } else if (val.message) {
    load_mailbox("sent");
    toastHead.innerHTML = val.message;
  }
  else{
    toastHead.innerHTML = val;
  }
  $("#myToast").toast({ delay: 4000 });
  $("#myToast").toast("show");
  $('#myToast').on('hidden.bs.toast', function () {
    toast.classList.add('hideToast')
  })
  // $("#myToast").toast('dispose');
}

function readable_date(mail_date) {
  let [mail_day, mail_year, mail_time] = mail_date.split("-");
  let d = new Date();
  if (mail_year === d.getFullYear().toString()) {
    if (mail_day.split(" ")[1] === d.getDate().toString()) {
      return mail_time;
    }
    return mail_day;
  } else {
    return `${mail_day}/${mail_year}`;
  }
}
function tog_menu() {
  var targetWidth = 768;
  if ($(window).width() <= targetWidth) {
    $("#sidebar").removeClass("side_active");
    $(".main").removeClass("spread");
    $(".overlay").removeClass("over_active");
    //Add your javascript for screens wider than or equal to 768 here
  }
}

function hide_element(element) {
  $(element).addClass("fade");
  element.addEventListener("animationend", () => {
    $(element).remove();
  });
}

//Random user avatar based on email

var colors = [
  "#FFB900",
  "#D83B01",
  "#B50E0E",
  "#E81123",
  "#B4009E",
  "#5C2D91",
  "#0078D7",
  "#00B4FF",
  "#008272",
  "#107C10",
];

function calculateColor(email) {
  var sum = 0;
  for (index in email) {
    sum += email.charCodeAt(index);
  }
  // console.log(sum % colors.length)
  return colors[sum % colors.length];
}
