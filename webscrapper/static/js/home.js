let loader = document.getElementById('loader_container');
let page_count = 1;
let tag = '';
let old_tag = '';

function show_message(message, alert_type){
    let toast = document.getElementById('messages');
    console.log(toast);
    toast.innerHTML = `
        <div aria-live="polite" aria-atomic="true" style="position: relative;">
            <div style="position: absolute; top: 0; right: 0;">
                <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header alert_${alert_type}" >
                    <strong class="mr-auto">Message</strong>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true" class="text-white">&times;</span>
                    </button>
                    </div>
                    <div class="toast-body">
                    <p><b>Alert: </b>${message}</p>
                    </div>
                </div>
            </div>
        </div>

    `;
    $('.toast').toast({
        delay: 4000,
    })
    $('.toast').toast('show');
}

function send_query(){
    tag = (document.getElementById('querytag').value).trim();
    if(tag == '' || tag == null){
        show_message(`Search Tag can't be Empty`, 'error');
    }else{
        if(old_tag != tag){
            let history = document.getElementById('history');
            history.style.display = 'block';
            history.innerHTML += `
                <li class="list-group-item">
                    <span class="badge badge-pill badge-info">${tag}</span>
                </li>
            `
            old_tag = tag;
        }
        send_post(tag);
    }
}

function insert_into_search(query){
    document.getElementById('querytag').value = query;
    page_count = 1;
    send_query();
}

function get_next_ten_articles(){
    page_count = page_count + 1;
    send_post(tag, page_count);
}

function get_prev_ten_articles(){
    page_count = page_count - 1;
    send_post(tag, page_count);
}

function send_post(query, page_count = 1){
    loader.style.display = 'block';
    let form_data = new FormData();
        let csrftoken = getCookie('csrftoken'); 
        form_data.append('csrfmiddlewaretoken',csrftoken);
        form_data.append('query',query);
        form_data.append('page_count',page_count);
        var ajax_req = new XMLHttpRequest();
        ajax_req.open("POST", "",true);
        ajax_req.onload = function(eve){
            let response = JSON.parse(ajax_req.response);
            if (response['status'] == 200){
                let article_container = document.getElementById('articles_containers');
                let tags_container = document.getElementById('tags_container');
                let articles_content = '', tags_content = '<span class="badge badge-light">#tags: &nbsp;</span>';
                let articles = JSON.parse(response['articles']);
                let tags = JSON.parse(response['tags']);
                let article_length = articles.length
                if(article_length == 0){
                    tags_container.innerHTML = '';
                    article_container.innerHTML = `
                        <div class="col-10 cardd">
                            <div class="container">
                                <h1 class="display-4" style="text-align: center;">No Articles Found.....!</h1>
                            </div>
                        </div>
                    `;
                }
                else{
                    articles.forEach(article => {
                        console.log(article);
                        articles_content += `
                            <div class="col-12 col-sm-12 col-md-5 col-lg-5 col-xl-5 card" style="width: 18rem;">
                                <a  href="${article['article_link']}" target="_blank">
                                    <img class="card-img-top" src="${article['article_image']}" alt="Card image cap">
                                    <div class="card-body">
                                        <h4 style="text-align: center"> ${article['title']} </h4>
                                        <p class="card-text">
                                            <i class="fa fa-user" aria-hidden="true"></i>&nbsp; By: <b> ${article['author']} </b> </br>
                                            <i class="fa fa-book" aria-hidden="true"></i>&nbsp; Published on: ${article['published_on']} </br>
                                            <i class="fa fa-clock" aria-hidden="true"></i>&nbsp; Time to Read: ${article['time_to_read']} </br>
                                            <i class="fa fa-bookmark" aria-hidden="true"></i> &nbsp;Responses: ${article['responses']} 
                                        </p>
                                    </div>
                                </a>
                            </div>
                        `;
                    });
                    tags.forEach(tag => {
                        tags_content += `
                            <span class="badge badge-secondary" onclick="insert_into_search('${tag['tag_name']}')">${tag['tag_name']}</span>&nbsp;
                        `;
                        
                    });
                    if(page_count > 1){
                        tags_container.innerHTML = `
                            <div class='col-8'>${tags_content}</div>
                            <div class='col-4'>
                                <span onclick="get_prev_ten_articles()" class="badge badge-light"> Go Back &nbsp;<i class="fa fa-angle-double-left" aria-hidden="true"></i></span>
                                &nbsp;
                                <span onclick="get_next_ten_articles()" class="badge badge-light"><i class="fa fa-angle-double-right" aria-hidden="true"></i>&nbsp; Get More</span>
                            </div>
                        `;

                    }else{
                        tags_container.innerHTML = `
                            <div class='col-8'>${tags_content}</div>
                            <div class='col-4'>
                                <span onclick="get_next_ten_articles()" class="badge badge-light"><i class="fa fa-angle-double-right" aria-hidden="true"></i>&nbsp; Get More</span>
                            </div>
                        `;
                    }
                    article_container.innerHTML = articles_content;
                }
                loader.style.display = 'none';
                show_message( `${response['message']} </br><i class="fa fa-clock" aria-hidden="true"></i>&nbsp; Time Taken: ${response['time_taken']} secs`, 'success')
            }
            else{
                loader.style.display = 'none';
                show_message( response['message'], 'error')
                console.log("Error Occured");
            }
        };
        ajax_req.send(form_data);
}


function getCookie(name) { // Function to generate CRSF Token
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
